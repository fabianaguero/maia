use rusqlite::{params, Connection, OptionalExtension};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::cmp::Ordering;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::{BufRead, BufReader, ErrorKind, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};

const CONTRACT_VERSION: &str = "1.0";
const INITIAL_LOG_TAIL_BYTES: u64 = 32 * 1024;
const MAX_LOG_TAIL_READ_BYTES: u64 = 128 * 1024;
const SESSION_RING_BUFFER_LINES: usize = 1_200;
const SCHEMA_SQL: &str = include_str!("../../../database/schema.sql");
const DEFAULT_MUSIC_STYLE_CATALOG_JSON: &str = include_str!("../../src/config/music-styles.json");
const DEFAULT_BASE_ASSET_CATEGORY_CATALOG_JSON: &str =
    include_str!("../../src/config/base-asset-categories.json");

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BootstrapManifest {
    app_name: String,
    contract_version: String,
    repo_root: String,
    analyzer_entrypoint: String,
    contracts_dir: String,
    database_schema: String,
    database_path: String,
    persistence_mode: String,
    docs_dir: String,
    runtime_mode: String,
    music_style_config_path: String,
    default_track_music_style_id: String,
    music_styles: Vec<MusicStyleOption>,
    base_asset_category_config_path: String,
    default_base_asset_category_id: String,
    base_asset_categories: Vec<BaseAssetCategoryOption>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MusicStyleOption {
    id: String,
    label: String,
    description: String,
    min_bpm: u16,
    max_bpm: u16,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MusicStyleCatalog {
    default_track_music_style_id: String,
    music_styles: Vec<MusicStyleOption>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BaseAssetCategoryOption {
    id: String,
    label: String,
    description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BaseAssetCategoryCatalog {
    default_base_asset_category_id: String,
    base_asset_categories: Vec<BaseAssetCategoryOption>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BeatGridPoint {
    index: u32,
    second: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BpmCurvePoint {
    second: f64,
    bpm: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct TrackStructuralPattern {
    r#type: String,
    start: f64,
    end: f64,
    confidence: f64,
    label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct TrackCuePoint {
    id: String,
    slot: Option<u32>,
    second: f64,
    label: String,
    kind: String,
    color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct TrackSavedLoop {
    id: String,
    slot: Option<u32>,
    start_second: f64,
    end_second: f64,
    label: String,
    color: Option<String>,
    locked: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TrackFileInfo {
    source_path: String,
    storage_path: Option<String>,
    source_kind: String,
    file_extension: String,
    size_bytes: Option<i64>,
    modified_at: Option<String>,
    checksum: Option<String>,
    availability_state: String,
    playback_source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TrackTagsInfo {
    title: String,
    artist: Option<String>,
    album: Option<String>,
    genre: Option<String>,
    year: Option<i32>,
    comment: Option<String>,
    artwork_path: Option<String>,
    music_style_id: String,
    music_style_label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TrackAnalysisInfo {
    imported_at: String,
    bpm: Option<f64>,
    bpm_confidence: f64,
    duration_seconds: Option<f64>,
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
    analyzer_status: String,
    analysis_mode: String,
    analyzer_version: Option<String>,
    analyzed_at: Option<String>,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    key_signature: Option<String>,
    energy_level: Option<f64>,
    danceability: Option<f64>,
    structural_patterns: Vec<TrackStructuralPattern>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TrackPerformanceInfo {
    color: Option<String>,
    rating: i64,
    play_count: i64,
    last_played_at: Option<String>,
    bpm_lock: bool,
    grid_lock: bool,
    main_cue_second: Option<f64>,
    hot_cues: Vec<TrackCuePoint>,
    memory_cues: Vec<TrackCuePoint>,
    saved_loops: Vec<TrackSavedLoop>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BaseTrackPlaylist {
    id: String,
    name: String,
    track_ids: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveBaseTrackPlaylistInput {
    id: Option<String>,
    name: String,
    track_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LibraryTrack {
    id: String,
    file: TrackFileInfo,
    tags: TrackTagsInfo,
    analysis: TrackAnalysisInfo,
    performance: TrackPerformanceInfo,
    title: String,
    source_path: String,
    storage_path: Option<String>,
    imported_at: String,
    bpm: Option<f64>,
    bpm_confidence: f64,
    duration_seconds: Option<f64>,
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
    analyzer_status: String,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    file_extension: String,
    analysis_mode: String,
    music_style_id: String,
    music_style_label: String,
    key_signature: Option<String>,
    energy_level: Option<f64>,
    danceability: Option<f64>,
    structural_patterns: Vec<TrackStructuralPattern>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BaseAssetRecord {
    id: String,
    title: String,
    source_path: String,
    storage_path: String,
    source_kind: String,
    imported_at: String,
    category_id: String,
    category_label: String,
    reusable: bool,
    entry_count: i64,
    checksum: Option<String>,
    confidence: f64,
    summary: String,
    analyzer_status: String,
    notes: Vec<String>,
    tags: Vec<String>,
    metrics: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct CompositionResultRecord {
    id: String,
    title: String,
    source_path: String,
    export_path: Option<String>,
    preview_audio_path: Option<String>,
    source_kind: String,
    imported_at: String,
    base_asset_id: String,
    base_asset_title: String,
    base_asset_category_id: String,
    base_asset_category_label: String,
    base_playlist_id: Option<String>,
    base_playlist_name: Option<String>,
    reference_type: String,
    reference_asset_id: Option<String>,
    reference_title: String,
    reference_source_path: Option<String>,
    target_bpm: f64,
    confidence: f64,
    strategy: String,
    summary: String,
    analyzer_status: String,
    notes: Vec<String>,
    tags: Vec<String>,
    metrics: Value,
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RepositoryAnalysis {
    id: String,
    title: String,
    source_path: String,
    storage_path: Option<String>,
    source_kind: String,
    imported_at: String,
    suggested_bpm: Option<f64>,
    confidence: f64,
    summary: String,
    analyzer_status: String,
    build_system: String,
    primary_language: String,
    java_file_count: i64,
    test_file_count: i64,
    notes: Vec<String>,
    tags: Vec<String>,
    metrics: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LiveLogCue {
    id: String,
    event_index: u32,
    level: String,
    component: String,
    excerpt: String,
    note_hz: f64,
    duration_ms: u32,
    gain: f64,
    waveform: String,
    accent: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LiveLogMarker {
    event_index: u32,
    level: String,
    component: String,
    excerpt: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LiveLogComponentCount {
    component: String,
    count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LiveLogStreamUpdate {
    source_path: String,
    from_offset: u64,
    to_offset: u64,
    has_data: bool,
    summary: String,
    suggested_bpm: Option<f64>,
    confidence: f64,
    dominant_level: String,
    line_count: i64,
    anomaly_count: i64,
    level_counts: Value,
    anomaly_markers: Vec<LiveLogMarker>,
    top_components: Vec<LiveLogComponentCount>,
    sonification_cues: Vec<LiveLogCue>,
    parsed_lines: Vec<String>,
    warnings: Vec<String>,
}

// ---------------------------------------------------------------------------
// Stream session registry — persists session metadata across poll cycles
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamSessionRecord {
    pub session_id: String,
    pub adapter_kind: String,  // file | process | websocket | http-poll | journald
    pub source: String,
    pub label: Option<String>,
    pub created_at: String,
    pub last_polled_at: Option<String>,
    pub total_polls: u64,
    pub file_cursor: Option<u64>,
}

#[derive(Debug)]
struct StreamSessionState {
    record: StreamSessionRecord,
    ring_buffer: Vec<String>,
    pending_lines: Vec<String>,
    process: Option<Child>,
}

impl StreamSessionState {
    fn new(record: StreamSessionRecord) -> Self {
        Self {
            record,
            ring_buffer: Vec::new(),
            pending_lines: Vec::new(),
            process: None,
        }
    }

    fn append_lines<I>(&mut self, lines: I)
    where
        I: IntoIterator<Item = String>,
    {
        for line in lines {
            self.pending_lines.push(line.clone());
            self.ring_buffer.push(line);
        }

        if self.ring_buffer.len() > SESSION_RING_BUFFER_LINES {
            let overflow = self.ring_buffer.len() - SESSION_RING_BUFFER_LINES;
            self.ring_buffer.drain(0..overflow);
        }
    }

    fn drain_pending_chunk(&mut self) -> String {
        std::mem::take(&mut self.pending_lines).join("\n")
    }
}

#[derive(Debug, Default)]
pub struct SessionRegistry {
    sessions: HashMap<String, StreamSessionState>,
}

pub type SessionRegistryState = Arc<Mutex<SessionRegistry>>;

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct StartSessionInput {
    session_id: String,
    adapter_kind: String,
    source: String,
    label: Option<String>,
    command: Option<Vec<String>>,
    start_from_beginning: Option<bool>,
}

fn append_lines_to_session<I>(
    registry: &SessionRegistryState,
    session_id: &str,
    lines: I,
) -> Result<(), String>
where
    I: IntoIterator<Item = String>,
{
    let mut reg = registry
        .lock()
        .map_err(|e| format!("Registry lock failed: {e}"))?;
    let session = reg
        .sessions
        .get_mut(session_id)
        .ok_or_else(|| format!("Session not found: {session_id}"))?;
    session.append_lines(lines);
    Ok(())
}

fn update_session_metadata<F>(
    registry: &SessionRegistryState,
    session_id: &str,
    update: F,
) -> Result<StreamSessionRecord, String>
where
    F: FnOnce(&mut StreamSessionState),
{
    let mut reg = registry
        .lock()
        .map_err(|e| format!("Registry lock failed: {e}"))?;
    let session = reg
        .sessions
        .get_mut(session_id)
        .ok_or_else(|| format!("Session not found: {session_id}"))?;
    update(session);
    Ok(session.record.clone())
}

fn drain_pending_chunk(
    registry: &SessionRegistryState,
    session_id: &str,
) -> Result<(StreamSessionRecord, String), String> {
    let mut reg = registry
        .lock()
        .map_err(|e| format!("Registry lock failed: {e}"))?;
    let session = reg
        .sessions
        .get_mut(session_id)
        .ok_or_else(|| format!("Session not found: {session_id}"))?;
    let chunk = session.drain_pending_chunk();
    Ok((session.record.clone(), chunk))
}

fn waiting_stream_poll_result(
    session: StreamSessionRecord,
    summary: &str,
    warnings: Vec<String>,
) -> StreamSessionPollResult {
    StreamSessionPollResult {
        session,
        has_data: false,
        summary: summary.to_string(),
        suggested_bpm: None,
        confidence: 0.0,
        dominant_level: "unknown".to_string(),
        line_count: 0,
        anomaly_count: 0,
        level_counts: Value::Object(serde_json::Map::new()),
        anomaly_markers: Vec::new(),
        top_components: Vec::new(),
        sonification_cues: Vec::new(),
        parsed_lines: Vec::new(),
        warnings,
    }
}

fn preview_stream_lines(chunk: &str) -> Vec<String> {
    let lines: Vec<String> = chunk
        .lines()
        .map(str::trim_end)
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.to_string())
        .collect();
    let start = lines.len().saturating_sub(5);
    lines[start..].to_vec()
}

fn analyze_stream_chunk(
    session: StreamSessionRecord,
    chunk: String,
    warnings: Vec<String>,
) -> Result<StreamSessionPollResult, String> {
    if chunk.trim().is_empty() {
        return Ok(waiting_stream_poll_result(
            session,
            "Waiting for new log lines.",
            warnings,
        ));
    }

    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("stream-analyze-{}", now_millis()),
        "action": "analyze",
        "payload": {
            "assetType": "repo_analysis",
            "source": {
                "kind": "file",
                "path": session.source
            },
            "options": {
                "inferCodeSuggestedBpm": true,
                "logTailChunk": chunk,
                "logTailLiveMode": true
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode stream analyzer response: {error}"))?;

    if parsed.status == "error" {
        let message = parsed
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| "Analyzer returned an unknown stream error.".to_string());
        return Err(message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a stream payload.".to_string())?;
    let mut merged_warnings = warnings;
    merged_warnings.extend(parsed.warnings);

    let metrics = &payload.musical_asset.metrics;
    let cues: Vec<LiveLogCue> = decode_json_metric(metrics, "sonificationCues")?;
    let parsed_lines = preview_stream_lines(&chunk);

    Ok(StreamSessionPollResult {
        session,
        has_data: true,
        summary: payload.summary,
        suggested_bpm: payload.musical_asset.suggested_bpm,
        confidence: payload.musical_asset.confidence,
        dominant_level: metric_string(metrics, "dominantLevel"),
        line_count: metric_i64(metrics, "lineCount"),
        anomaly_count: metric_i64(metrics, "anomalyCount"),
        level_counts: metrics
            .get("levelCounts")
            .cloned()
            .unwrap_or_else(|| Value::Object(serde_json::Map::new())),
        anomaly_markers: decode_json_metric(metrics, "anomalyMarkers")?,
        top_components: decode_json_metric(metrics, "topComponents")?,
        sonification_cues: cues,
        parsed_lines,
        warnings: merged_warnings,
    })
}

fn spawn_process_reader<R>(
    session_id: String,
    registry: SessionRegistryState,
    reader: R,
) where
    R: Read + Send + 'static,
{
    std::thread::spawn(move || {
        let buffered = BufReader::new(reader);
        for line in buffered.lines() {
            let Ok(text) = line else {
                break;
            };
            if append_lines_to_session(&registry, &session_id, vec![text]).is_err() {
                break;
            }
        }
    });
}

fn spawn_process_session(
    registry: SessionRegistryState,
    session_id: String,
    command: Vec<String>,
) -> Result<Child, String> {
    let (program, args) = command
        .split_first()
        .ok_or_else(|| "command list required for process adapter".to_string())?;

    let mut child = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Failed to start process adapter: {error}"))?;

    if let Some(stdout) = child.stdout.take() {
        spawn_process_reader(session_id.clone(), registry.clone(), stdout);
    }
    if let Some(stderr) = child.stderr.take() {
        spawn_process_reader(session_id, registry, stderr);
    }

    Ok(child)
}

// ---------------------------------------------------------------------------
// Persisted sessions (SQLite-backed)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedSession {
    pub id: String,
    pub label: Option<String>,
    pub source_id: Option<String>,
    pub source_title: Option<String>,
    pub source_path: Option<String>,
    pub source_kind: Option<String>,
    pub track_id: Option<String>,
    pub track_title: Option<String>,
    pub playlist_id: Option<String>,
    pub playlist_name: Option<String>,
    pub adapter_kind: String,
    pub mode: String,
    pub status: String,
    pub file_cursor: u64,
    pub total_polls: u64,
    pub total_lines: u64,
    pub total_anomalies: u64,
    pub last_bpm: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateSessionInput {
    id: String,
    label: Option<String>,
    source_id: Option<String>,
    track_id: Option<String>,
    playlist_id: Option<String>,
    adapter_kind: String,
    mode: String,
}

fn db_create_session(conn: &Connection, input: &CreateSessionInput) -> Result<PersistedSession, String> {
    let now = now_iso();
    conn.execute(
        "INSERT OR REPLACE INTO sessions (id, label, source_id, track_id, playlist_id, adapter_kind, mode, status, file_cursor, total_polls, total_lines, total_anomalies, last_bpm, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'stopped', 0, 0, 0, 0, NULL, ?8, ?8)",
        rusqlite::params![
            input.id,
            input.label,
            input.source_id,
            input.track_id,
            input.playlist_id,
            input.adapter_kind,
            input.mode,
            now
        ],
    ).map_err(|e| format!("Failed to create session: {e}"))?;

    db_get_session(conn, &input.id)
}

fn db_get_session(conn: &Connection, id: &str) -> Result<PersistedSession, String> {
    conn.query_row(
        "SELECT s.id, s.label, s.source_id,
                ma_src.title, ma_src.source_path, ma_src.source_kind,
                s.track_id, ma_trk.title,
                s.playlist_id, p.name,
                s.adapter_kind, s.mode, s.status,
                s.file_cursor, s.total_polls, s.total_lines, s.total_anomalies, s.last_bpm,
                s.created_at, s.updated_at
         FROM sessions s
         LEFT JOIN musical_assets ma_src ON ma_src.id = s.source_id
         LEFT JOIN musical_assets ma_trk ON ma_trk.id = s.track_id
         LEFT JOIN base_track_playlists p ON p.id = s.playlist_id
         WHERE s.id = ?1",
        rusqlite::params![id],
        row_to_persisted_session,
    ).map_err(|e| format!("Session not found: {e}"))
}

fn row_to_persisted_session(row: &rusqlite::Row<'_>) -> rusqlite::Result<PersistedSession> {
    Ok(PersistedSession {
        id: row.get(0)?,
        label: row.get(1)?,
        source_id: row.get(2)?,
        source_title: row.get(3)?,
        source_path: row.get(4)?,
        source_kind: row.get(5)?,
        track_id: row.get(6)?,
        track_title: row.get(7)?,
        playlist_id: row.get(8)?,
        playlist_name: row.get(9)?,
        adapter_kind: row.get(10)?,
        mode: row.get(11)?,
        status: row.get(12)?,
        file_cursor: row.get::<_, i64>(13).map(|v| v as u64)?,
        total_polls: row.get::<_, i64>(14).map(|v| v as u64)?,
        total_lines: row.get::<_, i64>(15).map(|v| v as u64)?,
        total_anomalies: row.get::<_, i64>(16).map(|v| v as u64)?,
        last_bpm: row.get(17)?,
        created_at: row.get(18)?,
        updated_at: row.get(19)?,
    })
}

fn db_list_sessions(conn: &Connection) -> Result<Vec<PersistedSession>, String> {
    let mut stmt = conn.prepare(
        "SELECT s.id, s.label, s.source_id,
                ma_src.title, ma_src.source_path, ma_src.source_kind,
                s.track_id, ma_trk.title,
                s.playlist_id, p.name,
                s.adapter_kind, s.mode, s.status,
                s.file_cursor, s.total_polls, s.total_lines, s.total_anomalies, s.last_bpm,
                s.created_at, s.updated_at
         FROM sessions s
         LEFT JOIN musical_assets ma_src ON ma_src.id = s.source_id
         LEFT JOIN musical_assets ma_trk ON ma_trk.id = s.track_id
         LEFT JOIN base_track_playlists p ON p.id = s.playlist_id
         ORDER BY s.updated_at DESC",
    ).map_err(|e| format!("Failed to prepare session list: {e}"))?;

    let rows = stmt.query_map([], row_to_persisted_session)
        .map_err(|e| format!("Failed to query sessions: {e}"))?;

    rows.map(|r| r.map_err(|e| format!("Row error: {e}")))
        .collect()
}

fn db_update_session_status(conn: &Connection, id: &str, status: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE sessions SET status = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![status, now_iso(), id],
    ).map_err(|e| format!("Failed to update session status: {e}"))?;
    Ok(())
}

fn db_update_session_cursor(
    conn: &Connection,
    id: &str,
    cursor: u64,
    lines_delta: u64,
    anomalies_delta: u64,
    last_bpm: Option<f64>,
) -> Result<(), String> {
    conn.execute(
        "UPDATE sessions SET
            file_cursor = ?1,
            total_polls = total_polls + 1,
            total_lines = total_lines + ?2,
            total_anomalies = total_anomalies + ?3,
            last_bpm = COALESCE(?4, last_bpm),
            status = 'active',
            updated_at = ?5
         WHERE id = ?6",
        rusqlite::params![cursor as i64, lines_delta as i64, anomalies_delta as i64, last_bpm, now_iso(), id],
    ).map_err(|e| format!("Failed to update session cursor: {e}"))?;
    Ok(())
}

fn db_delete_session(conn: &Connection, id: &str) -> Result<bool, String> {
    let n = conn.execute("DELETE FROM sessions WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Failed to delete session: {e}"))?;
    Ok(n > 0)
}

// ---------------------------------------------------------------------------
// Session events (per-poll time-series data for playback)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionEvent {
    pub id: i64,
    pub session_id: String,
    pub poll_index: u64,
    pub captured_at: String,
    pub from_offset: u64,
    pub to_offset: u64,
    pub summary: String,
    pub suggested_bpm: Option<f64>,
    pub confidence: f64,
    pub dominant_level: String,
    pub line_count: u64,
    pub anomaly_count: u64,
    pub level_counts_json: String,
    pub anomaly_markers_json: String,
    pub top_components_json: String,
    pub sonification_cues_json: String,
    pub parsed_lines_json: String,
    pub warnings_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionBookmark {
    pub id: i64,
    pub session_id: String,
    pub replay_window_index: u64,
    pub event_index: Option<u64>,
    pub label: String,
    pub note: String,
    pub bookmark_tag: Option<String>,
    pub suggested_style_profile_id: Option<String>,
    pub suggested_mutation_profile_id: Option<String>,
    pub track_id: Option<String>,
    pub track_title: Option<String>,
    pub track_second: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpsertSessionBookmarkInput {
    session_id: String,
    replay_window_index: u64,
    event_index: Option<u64>,
    label: String,
    note: String,
    bookmark_tag: Option<String>,
    suggested_style_profile_id: Option<String>,
    suggested_mutation_profile_id: Option<String>,
    track_id: Option<String>,
    track_title: Option<String>,
    track_second: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct InsertSessionEventInput {
    session_id: String,
    poll_index: u64,
    from_offset: u64,
    to_offset: u64,
    summary: String,
    suggested_bpm: Option<f64>,
    confidence: f64,
    dominant_level: String,
    line_count: u64,
    anomaly_count: u64,
    level_counts_json: String,
    anomaly_markers_json: String,
    top_components_json: String,
    sonification_cues_json: String,
    parsed_lines_json: String,
    warnings_json: String,
}

fn db_insert_session_event(conn: &Connection, input: &InsertSessionEventInput) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO session_events (session_id, poll_index, captured_at, from_offset, to_offset,
            summary, suggested_bpm, confidence, dominant_level, line_count, anomaly_count,
            level_counts_json, anomaly_markers_json, top_components_json, sonification_cues_json, parsed_lines_json, warnings_json)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        rusqlite::params![
            input.session_id, input.poll_index as i64, now_iso(),
            input.from_offset as i64, input.to_offset as i64,
            input.summary, input.suggested_bpm, input.confidence, input.dominant_level,
            input.line_count as i64, input.anomaly_count as i64,
            input.level_counts_json, input.anomaly_markers_json,
            input.top_components_json, input.sonification_cues_json, input.parsed_lines_json,
            input.warnings_json,
        ],
    ).map_err(|e| format!("Failed to insert session event: {e}"))?;
    Ok(conn.last_insert_rowid())
}

fn db_list_session_events(conn: &Connection, session_id: &str) -> Result<Vec<SessionEvent>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, poll_index, captured_at, from_offset, to_offset,
                summary, suggested_bpm, confidence, dominant_level, line_count, anomaly_count,
                level_counts_json, anomaly_markers_json, top_components_json,
                sonification_cues_json, parsed_lines_json, warnings_json
         FROM session_events
         WHERE session_id = ?1
         ORDER BY poll_index ASC",
    ).map_err(|e| format!("Failed to prepare session events query: {e}"))?;

    let rows = stmt.query_map(rusqlite::params![session_id], |row| {
        Ok(SessionEvent {
            id: row.get(0)?,
            session_id: row.get(1)?,
            poll_index: row.get::<_, i64>(2).map(|v| v as u64)?,
            captured_at: row.get(3)?,
            from_offset: row.get::<_, i64>(4).map(|v| v as u64)?,
            to_offset: row.get::<_, i64>(5).map(|v| v as u64)?,
            summary: row.get(6)?,
            suggested_bpm: row.get(7)?,
            confidence: row.get(8)?,
            dominant_level: row.get(9)?,
            line_count: row.get::<_, i64>(10).map(|v| v as u64)?,
            anomaly_count: row.get::<_, i64>(11).map(|v| v as u64)?,
            level_counts_json: row.get(12)?,
            anomaly_markers_json: row.get(13)?,
            top_components_json: row.get(14)?,
            sonification_cues_json: row.get(15)?,
            parsed_lines_json: row.get(16)?,
            warnings_json: row.get(17)?,
        })
    }).map_err(|e| format!("Failed to query session events: {e}"))?;

    rows.map(|r| r.map_err(|e| format!("Row error: {e}"))).collect()
}

fn row_to_session_bookmark(row: &rusqlite::Row<'_>) -> rusqlite::Result<SessionBookmark> {
    Ok(SessionBookmark {
        id: row.get(0)?,
        session_id: row.get(1)?,
        replay_window_index: row.get::<_, i64>(2).map(|v| v as u64)?,
        event_index: row
            .get::<_, Option<i64>>(3)?
            .map(|value| value as u64),
        label: row.get(4)?,
        note: row.get(5)?,
        bookmark_tag: row.get(6)?,
        suggested_style_profile_id: row.get(7)?,
        suggested_mutation_profile_id: row.get(8)?,
        track_id: row.get(9)?,
        track_title: row.get(10)?,
        track_second: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

fn db_upsert_session_bookmark(
    conn: &Connection,
    input: &UpsertSessionBookmarkInput,
) -> Result<SessionBookmark, String> {
    let now = now_iso();
    conn.execute(
        "INSERT INTO session_bookmarks (
            session_id,
            replay_window_index,
            event_index,
            label,
            note,
            bookmark_tag,
            suggested_style_profile_id,
            suggested_mutation_profile_id,
            track_id,
            track_title,
            track_second,
            created_at,
            updated_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12)
         ON CONFLICT(session_id, replay_window_index) DO UPDATE SET
            event_index = excluded.event_index,
            label = excluded.label,
            note = excluded.note,
            bookmark_tag = excluded.bookmark_tag,
            suggested_style_profile_id = excluded.suggested_style_profile_id,
            suggested_mutation_profile_id = excluded.suggested_mutation_profile_id,
            track_id = excluded.track_id,
            track_title = excluded.track_title,
            track_second = excluded.track_second,
            updated_at = excluded.updated_at",
        rusqlite::params![
            input.session_id,
            input.replay_window_index as i64,
            input.event_index.map(|value| value as i64),
            input.label.trim(),
            input.note.trim(),
            input.bookmark_tag.as_ref().map(|value| value.trim()).filter(|value| !value.is_empty()),
            input
                .suggested_style_profile_id
                .as_ref()
                .map(|value| value.trim())
                .filter(|value| !value.is_empty()),
            input
                .suggested_mutation_profile_id
                .as_ref()
                .map(|value| value.trim())
                .filter(|value| !value.is_empty()),
            input.track_id,
            input.track_title,
            input.track_second,
            now,
        ],
    )
    .map_err(|e| format!("Failed to upsert session bookmark: {e}"))?;

    conn.query_row(
        "SELECT id, session_id, replay_window_index, event_index, label, note,
                bookmark_tag, suggested_style_profile_id, suggested_mutation_profile_id,
                track_id, track_title, track_second, created_at, updated_at
         FROM session_bookmarks
         WHERE session_id = ?1 AND replay_window_index = ?2",
        rusqlite::params![input.session_id, input.replay_window_index as i64],
        row_to_session_bookmark,
    )
    .map_err(|e| format!("Failed to load session bookmark: {e}"))
}

fn db_list_session_bookmarks(
    conn: &Connection,
    session_id: &str,
) -> Result<Vec<SessionBookmark>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, replay_window_index, event_index, label, note,
                    bookmark_tag, suggested_style_profile_id, suggested_mutation_profile_id,
                    track_id, track_title, track_second, created_at, updated_at
             FROM session_bookmarks
             WHERE session_id = ?1
             ORDER BY replay_window_index ASC, updated_at DESC",
        )
        .map_err(|e| format!("Failed to prepare session bookmarks query: {e}"))?;

    let rows = stmt
        .query_map(rusqlite::params![session_id], row_to_session_bookmark)
        .map_err(|e| format!("Failed to query session bookmarks: {e}"))?;

    rows.map(|r| r.map_err(|e| format!("Row error: {e}"))).collect()
}

fn db_delete_session_bookmark(conn: &Connection, id: i64) -> Result<bool, String> {
    let deleted = conn
        .execute(
            "DELETE FROM session_bookmarks WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| format!("Failed to delete session bookmark: {e}"))?;
    Ok(deleted > 0)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StreamSessionPollResult {
    session: StreamSessionRecord,
    has_data: bool,
    summary: String,
    suggested_bpm: Option<f64>,
    confidence: f64,
    dominant_level: String,
    line_count: i64,
    anomaly_count: i64,
    level_counts: Value,
    anomaly_markers: Vec<LiveLogMarker>,
    top_components: Vec<LiveLogComponentCount>,
    sonification_cues: Vec<LiveLogCue>,
    parsed_lines: Vec<String>,
    warnings: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportTrackInput {
    title: String,
    source_path: String,
    music_style_id: String,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct UpdateTrackPerformanceInput {
    rating: Option<i64>,
    color: Option<Option<String>>,
    bpm_lock: Option<bool>,
    grid_lock: Option<bool>,
    mark_played: Option<bool>,
    main_cue_second: Option<Option<f64>>,
    hot_cues: Option<Vec<TrackCuePoint>>,
    memory_cues: Option<Vec<TrackCuePoint>>,
    saved_loops: Option<Vec<TrackSavedLoop>>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct UpdateTrackAnalysisInput {
    bpm: Option<f64>,
    beat_grid: Option<Vec<BeatGridPoint>>,
    bpm_curve: Option<Vec<BpmCurvePoint>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportRepositoryInput {
    source_kind: String,
    source_path: String,
    label: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportBaseAssetInput {
    source_kind: String,
    source_path: String,
    label: Option<String>,
    category_id: String,
    reusable: bool,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ImportCompositionInput {
    base_asset_id: String,
    reference_type: String,
    reference_asset_id: Option<String>,
    manual_bpm: Option<f64>,
    label: Option<String>,
    track_id: Option<String>,
    playlist_id: Option<String>,
    structure_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct TrackFileMetadata {
    source_kind: String,
    file_extension: String,
    size_bytes: Option<i64>,
    modified_at: Option<String>,
    checksum: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct TrackTagsMetadata {
    title: Option<String>,
    artist: Option<String>,
    album: Option<String>,
    genre: Option<String>,
    year: Option<i32>,
    comment: Option<String>,
    artwork_path: Option<String>,
    music_style_id: String,
    music_style_label: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct TrackAnalysisMetadata {
    analyzer_status: String,
    analysis_mode: String,
    analyzer_version: Option<String>,
    analyzed_at: Option<String>,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    key_signature: Option<String>,
    energy_level: Option<f64>,
    danceability: Option<f64>,
    structural_patterns: Vec<TrackStructuralPattern>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct TrackMetadata {
    file: TrackFileMetadata,
    tags: TrackTagsMetadata,
    analysis: TrackAnalysisMetadata,

    // Legacy flat fields retained for backward-compatible decoding.
    file_extension: String,
    analyzer_status: String,
    analysis_mode: String,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    music_style_id: String,
    music_style_label: String,
    key_signature: Option<String>,
    energy_level: Option<f64>,
    danceability: Option<f64>,
    structural_patterns: Vec<TrackStructuralPattern>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RepositoryMetadata {
    source_kind: String,
    analyzer_status: String,
    notes: Vec<String>,
    tags: Vec<String>,
    import_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct BaseAssetMetadata {
    category_id: String,
    category_label: String,
    analyzer_status: String,
    summary: String,
    notes: Vec<String>,
    tags: Vec<String>,
    metrics: Value,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct CompositionMetadata {
    base_asset_id: String,
    base_asset_title: String,
    base_asset_category_id: String,
    base_asset_category_label: String,
    base_playlist_id: Option<String>,
    base_playlist_name: Option<String>,
    reference_type: String,
    reference_asset_id: Option<String>,
    reference_title: String,
    reference_source_path: Option<String>,
    analyzer_status: String,
    strategy: String,
    summary: String,
    notes: Vec<String>,
    tags: Vec<String>,
    metrics: Value,
}

struct TrackImportAnalysis {
    title: String,
    source_path: String,
    storage_path: Option<String>,
    bpm: f64,
    confidence: f64,
    duration_seconds: Option<f64>,
    sample_rate_hz: Option<i64>,
    channels: Option<i64>,
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
    beat_grid_json: String,
    bpm_curve_json: String,
    metadata: TrackMetadata,
    analyzer_notes: String,
}

#[derive(Debug, Clone)]
struct TrackLibraryStateDb {
    color: Option<String>,
    rating: i64,
    play_count: i64,
    last_played_at: Option<String>,
    bpm_lock: bool,
    grid_lock: bool,
    main_cue_second: Option<f64>,
    hot_cues: Vec<TrackCuePoint>,
    memory_cues: Vec<TrackCuePoint>,
    saved_loops: Vec<TrackSavedLoop>,
    missing_state: String,
    file_size_bytes: Option<i64>,
    source_modified_at: Option<String>,
    source_checksum: Option<String>,
}

struct BaseAssetImportAnalysis {
    title: String,
    source_path: String,
    storage_path: String,
    source_kind: String,
    category_id: String,
    category_label: String,
    reusable: bool,
    entry_count: i64,
    checksum: Option<String>,
    confidence: f64,
    summary: String,
    metrics: Value,
    metadata: BaseAssetMetadata,
}

struct CompositionImportAnalysis {
    title: String,
    source_path: String,
    preview_audio_path: Option<String>,
    source_kind: String,
    base_asset_id: String,
    base_asset_title: String,
    base_asset_category_id: String,
    base_asset_category_label: String,
    reference_type: String,
    reference_asset_id: Option<String>,
    reference_title: String,
    reference_source_path: Option<String>,
    target_bpm: f64,
    confidence: f64,
    strategy: String,
    summary: String,
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
    waveform_bins_json: String,
    beat_grid_json: String,
    bpm_curve_json: String,
    metrics: Value,
    metadata: CompositionMetadata,
}

struct CompositionReferenceDraft {
    base_playlist_id: Option<String>,
    base_playlist_name: Option<String>,
    reference_type: String,
    reference_asset_id: Option<String>,
    reference_title: String,
    reference_source_path: Option<String>,
    target_bpm: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzerResponseEnvelope {
    status: String,
    payload: Option<AnalyzerResponsePayload>,
    error: Option<AnalyzerErrorInfo>,
    warnings: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzerResponsePayload {
    summary: String,
    musical_asset: AnalyzerMusicalAsset,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzerMusicalAsset {
    title: String,
    source_path: String,
    suggested_bpm: Option<f64>,
    confidence: f64,
    tags: Vec<String>,
    metrics: Value,
    artifacts: AnalyzerArtifacts,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct AnalyzerArtifacts {
    waveform_bins: Vec<f64>,
    beat_grid: Vec<BeatGridPoint>,
    bpm_curve: Vec<BpmCurvePoint>,
}

#[derive(Debug, Deserialize)]
struct AnalyzerErrorInfo {
    code: String,
    message: String,
}

enum NativePickerKind {
    File,
    Directory,
    SaveFile,
}

#[tauri::command]
fn bootstrap_manifest(app_handle: AppHandle) -> Result<BootstrapManifest, String> {
    let repo_root = repo_root();
    let analyzer_python = analyzer_python(&repo_root);
    let database_path = database_path(&app_handle)?;
    let music_style_catalog = load_music_style_catalog(&repo_root);
    let music_style_config_path = music_style_config_path(&repo_root);
    let base_asset_category_catalog = load_base_asset_category_catalog(&repo_root);
    let base_asset_category_config_path = base_asset_category_config_path(&repo_root);

    Ok(BootstrapManifest {
        app_name: "Maia".to_string(),
        contract_version: CONTRACT_VERSION.to_string(),
        repo_root: repo_root.display().to_string(),
        analyzer_entrypoint: format!("{analyzer_python} -m maia_analyzer.cli"),
        contracts_dir: repo_root.join("contracts").display().to_string(),
        database_schema: repo_root.join("database/schema.sql").display().to_string(),
        database_path: database_path.display().to_string(),
        persistence_mode: "sqlite".to_string(),
        docs_dir: repo_root.join("docs").display().to_string(),
        runtime_mode: "tauri".to_string(),
        music_style_config_path: music_style_config_path.display().to_string(),
        default_track_music_style_id: music_style_catalog.default_track_music_style_id.clone(),
        music_styles: music_style_catalog.music_styles.clone(),
        base_asset_category_config_path: base_asset_category_config_path.display().to_string(),
        default_base_asset_category_id: base_asset_category_catalog
            .default_base_asset_category_id
            .clone(),
        base_asset_categories: base_asset_category_catalog.base_asset_categories.clone(),
    })
}

#[tauri::command]
fn run_analyzer(request: Value) -> Result<Value, String> {
    execute_analyzer_request(&request)
}

#[tauri::command]
fn pick_track_source_path(initial_path: Option<String>) -> Result<Option<String>, String> {
    pick_native_path(
        NativePickerKind::File,
        initial_path,
        "Select audio file",
        Some("Audio files (*.wav *.mp3 *.flac *.aif *.aiff *.m4a *.ogg *.oga)"),
    )
}

#[tauri::command]
fn pick_repository_directory(initial_path: Option<String>) -> Result<Option<String>, String> {
    pick_native_path(
        NativePickerKind::Directory,
        initial_path,
        "Select repository directory",
        None,
    )
}

#[tauri::command]
fn pick_repository_file(initial_path: Option<String>) -> Result<Option<String>, String> {
    pick_native_path(
        NativePickerKind::File,
        initial_path,
        "Select log file",
        Some("Log files (*.log *.txt *.out *.err *.jsonl *.ndjson)"),
    )
}

#[tauri::command]
fn poll_log_stream(
    source_path: String,
    cursor: Option<u64>,
    max_bytes: Option<u64>,
) -> Result<LiveLogStreamUpdate, String> {
    eprintln!("[MAIA:Rust] poll_log_stream path={} cursor={:?}", source_path, cursor);
    let (resolved_path, from_offset, to_offset, chunk, local_warnings) =
        read_log_stream_chunk(&source_path, cursor, max_bytes)?;

    let has_data = !chunk.trim().is_empty();
    eprintln!("[MAIA:Rust] poll_log_stream has_data={} chunk_len={} from={} to={}", has_data, chunk.len(), from_offset, to_offset);
    let mut warnings = local_warnings;

    if !has_data {
        return Ok(LiveLogStreamUpdate {
            source_path: resolved_path,
            from_offset,
            to_offset,
            has_data: false,
            summary: "Waiting for new log lines.".to_string(),
            suggested_bpm: None,
            confidence: 0.0,
            dominant_level: "unknown".to_string(),
            line_count: 0,
            anomaly_count: 0,
            level_counts: Value::Object(serde_json::Map::new()),
            anomaly_markers: Vec::new(),
            top_components: Vec::new(),
            sonification_cues: Vec::new(),
            parsed_lines: Vec::new(),
            warnings,
        });
    }

    let now = now_millis().to_string();
    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("log-tail-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "repo_analysis",
            "source": {
                "kind": "file",
                "path": resolved_path
            },
            "options": {
                "inferCodeSuggestedBpm": true,
                "logTailChunk": chunk,
                "logTailFromOffset": from_offset,
                "logTailToOffset": to_offset,
                "logTailLiveMode": true
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode log tail analyzer response: {error}"))?;

    if parsed.status == "error" {
        let message = parsed
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| "Analyzer returned an unknown log-tail error.".to_string());
        return Err(message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a log-tail payload.".to_string())?;
    warnings.extend(parsed.warnings.clone());

    let metrics = &payload.musical_asset.metrics;
    let cues: Vec<LiveLogCue> = decode_json_metric(metrics, "sonificationCues")?;
    let parsed_lines = preview_stream_lines(&chunk);
    eprintln!("[MAIA:Rust] poll_log_stream → lines={} anomalies={} cues={} bpm={:?}",
        metric_i64(metrics, "lineCount"), metric_i64(metrics, "anomalyCount"), cues.len(), payload.musical_asset.suggested_bpm);
    Ok(LiveLogStreamUpdate {
        source_path: resolved_path,
        from_offset,
        to_offset,
        has_data: true,
        summary: payload.summary,
        suggested_bpm: payload.musical_asset.suggested_bpm,
        confidence: payload.musical_asset.confidence,
        dominant_level: metric_string(metrics, "dominantLevel"),
        line_count: metric_i64(metrics, "lineCount"),
        anomaly_count: metric_i64(metrics, "anomalyCount"),
        level_counts: metrics
            .get("levelCounts")
            .cloned()
            .unwrap_or_else(|| Value::Object(serde_json::Map::new())),
        anomaly_markers: decode_json_metric(metrics, "anomalyMarkers")?,
        top_components: decode_json_metric(metrics, "topComponents")?,
        sonification_cues: cues,
        parsed_lines,
        warnings,
    })
}

// ---------------------------------------------------------------------------
// Stream session commands
// ---------------------------------------------------------------------------

#[tauri::command]
fn start_stream_session(
    input: StartSessionInput,
    registry: State<'_, SessionRegistryState>,
) -> Result<StreamSessionRecord, String> {
    eprintln!("[MAIA:Rust] start_stream_session id={} adapter={} source={}", input.session_id, input.adapter_kind, input.source);
    let session_id = input.session_id.trim().to_string();
    if session_id.is_empty() {
        return Err("sessionId must not be empty".to_string());
    }
    if input.source.trim().is_empty() {
        return Err("source must not be empty".to_string());
    }

    let record = StreamSessionRecord {
        session_id: session_id.clone(),
        adapter_kind: input.adapter_kind.clone(),
        source: input.source.clone(),
        label: input.label.clone(),
        created_at: now_iso(),
        last_polled_at: None,
        total_polls: 0,
        file_cursor: if input.adapter_kind == "file" && input.start_from_beginning.unwrap_or(false) {
            Some(0)
        } else {
            None
        },
    };

    {
        let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
        reg.sessions
            .insert(session_id.clone(), StreamSessionState::new(record.clone()));
    }

    if input.adapter_kind == "journald" {
        let mut cmd: Vec<String> = vec![
            "journalctl".to_string(),
            "-f".to_string(),
            "-o".to_string(),
            "json".to_string(),
            "--no-pager".to_string(),
        ];
        let unit = input.source.trim().to_string();
        if !unit.is_empty() && unit != "system" {
            cmd.push("-u".to_string());
            cmd.push(unit);
        }

        let registry_handle = Arc::clone(&*registry);
        let child = match spawn_process_session(registry_handle, session_id.clone(), cmd) {
            Ok(child) => child,
            Err(error) => {
                let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
                reg.sessions.remove(&session_id);
                return Err(error);
            }
        };
        let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
        if let Some(session) = reg.sessions.get_mut(&session_id) {
            session.process = Some(child);
        }
    } else if input.adapter_kind == "process" {
        let command = input.command.clone().unwrap_or_default();
        if command.is_empty() {
            let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
            reg.sessions.remove(&session_id);
            return Err("command list required for process adapter".to_string());
        }

        let registry_handle = Arc::clone(&*registry);
        let child = match spawn_process_session(registry_handle, session_id.clone(), command) {
            Ok(child) => child,
            Err(error) => {
                let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
                reg.sessions.remove(&session_id);
                return Err(error);
            }
        };

        let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
        if let Some(session) = reg.sessions.get_mut(&session_id) {
            session.process = Some(child);
        }
    }

    Ok(record)
}

#[tauri::command]
fn stop_stream_session(
    session_id: String,
    registry: State<'_, SessionRegistryState>,
) -> Result<bool, String> {
    let mut reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
    let mut removed = reg.sessions.remove(&session_id);
    if let Some(session) = removed.as_mut() {
        if let Some(process) = session.process.as_mut() {
            let _ = process.kill();
            let _ = process.wait();
        }
    }
    Ok(removed.is_some())
}

#[tauri::command]
fn list_stream_sessions(
    registry: State<'_, SessionRegistryState>,
) -> Result<Vec<StreamSessionRecord>, String> {
    let reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
    let mut sessions: Vec<StreamSessionRecord> =
        reg.sessions.values().map(|state| state.record.clone()).collect();
    sessions.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    Ok(sessions)
}

// ---------------------------------------------------------------------------
// Persisted session commands
// ---------------------------------------------------------------------------

#[tauri::command]
fn create_persisted_session(
    app_handle: AppHandle,
    input: CreateSessionInput,
) -> Result<PersistedSession, String> {
    let conn = open_database(&app_handle)?;
    db_create_session(&conn, &input)
}

#[tauri::command]
fn list_persisted_sessions(app_handle: AppHandle) -> Result<Vec<PersistedSession>, String> {
    let conn = open_database(&app_handle)?;
    db_list_sessions(&conn)
}

#[tauri::command]
fn get_persisted_session(app_handle: AppHandle, id: String) -> Result<PersistedSession, String> {
    let conn = open_database(&app_handle)?;
    db_get_session(&conn, &id)
}

#[tauri::command]
fn update_persisted_session_status(
    app_handle: AppHandle,
    id: String,
    status: String,
) -> Result<(), String> {
    let conn = open_database(&app_handle)?;
    db_update_session_status(&conn, &id, &status)
}

#[tauri::command]
fn update_persisted_session_cursor(
    app_handle: AppHandle,
    id: String,
    cursor: u64,
    lines_delta: u64,
    anomalies_delta: u64,
    last_bpm: Option<f64>,
) -> Result<(), String> {
    let conn = open_database(&app_handle)?;
    db_update_session_cursor(&conn, &id, cursor, lines_delta, anomalies_delta, last_bpm)
}

#[tauri::command]
fn delete_persisted_session(app_handle: AppHandle, id: String) -> Result<bool, String> {
    let conn = open_database(&app_handle)?;
    db_delete_session(&conn, &id)
}

#[tauri::command]
fn insert_session_event(
    app_handle: AppHandle,
    input: InsertSessionEventInput,
) -> Result<i64, String> {
    let conn = open_database(&app_handle)?;
    db_insert_session_event(&conn, &input)
}

#[tauri::command]
fn list_session_events(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Vec<SessionEvent>, String> {
    let conn = open_database(&app_handle)?;
    db_list_session_events(&conn, &session_id)
}

#[tauri::command]
fn upsert_session_bookmark(
    app_handle: AppHandle,
    input: UpsertSessionBookmarkInput,
) -> Result<SessionBookmark, String> {
    let conn = open_database(&app_handle)?;
    db_upsert_session_bookmark(&conn, &input)
}

#[tauri::command]
fn list_session_bookmarks(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Vec<SessionBookmark>, String> {
    let conn = open_database(&app_handle)?;
    db_list_session_bookmarks(&conn, &session_id)
}

#[tauri::command]
fn delete_session_bookmark(app_handle: AppHandle, id: i64) -> Result<bool, String> {
    let conn = open_database(&app_handle)?;
    db_delete_session_bookmark(&conn, id)
}

#[tauri::command]
fn poll_stream_session(
    session_id: String,
    registry: State<'_, SessionRegistryState>,
) -> Result<StreamSessionPollResult, String> {
    eprintln!("[MAIA:Rust] poll_stream_session id={}", session_id);
    let (adapter_kind, source, cursor) = {
        let reg = registry.lock().map_err(|e| format!("Registry lock failed: {e}"))?;
        let session = reg.sessions.get(&session_id)
            .ok_or_else(|| format!("Session not found: {session_id}"))?;
        (
            session.record.adapter_kind.clone(),
            session.record.source.clone(),
            session.record.file_cursor,
        )
    };

    let mut warnings: Vec<String> = Vec::new();

    if adapter_kind == "file" {
        let (_resolved, _from, to_offset, chunk, read_warnings) =
            read_log_stream_chunk(&source, cursor, None)?;
        warnings.extend(read_warnings);

        let session_record = update_session_metadata(&registry, &session_id, |session| {
            session.record.file_cursor = Some(to_offset);
            session.record.last_polled_at = Some(now_iso());
            session.record.total_polls += 1;
        })?;

        if chunk.trim().is_empty() {
            return Ok(waiting_stream_poll_result(
                session_record,
                "Waiting for new log lines.",
                warnings,
            ));
        }

        append_lines_to_session(&registry, &session_id, chunk.lines().map(str::to_string))?;
        return analyze_stream_chunk(session_record, chunk, warnings);
    }

    let (session_record, chunk) = {
        let session_record = update_session_metadata(&registry, &session_id, |session| {
            session.record.last_polled_at = Some(now_iso());
            session.record.total_polls += 1;
        })?;
        let (_, chunk) = drain_pending_chunk(&registry, &session_id)?;
        (session_record, chunk)
    };

    analyze_stream_chunk(session_record, chunk, warnings)
}

// ---------------------------------------------------------------------------
// ingest_stream_chunk — used by WebSocket and HTTP-poll adapters that manage
// their own connection on the JS side. Feeds a raw text chunk into the
// Rust-owned transient session buffer and analyzes just that chunk through the
// stateless Python analyzer. If `chunk` is empty the feed step is skipped and
// a waiting result is returned.
// ---------------------------------------------------------------------------

#[tauri::command]
fn ingest_stream_chunk(
    session_id: String,
    chunk: String,
    registry: State<'_, SessionRegistryState>,
) -> Result<StreamSessionPollResult, String> {
    let warnings: Vec<String> = Vec::new();

    let session_record = update_session_metadata(&registry, &session_id, |session| {
        session.record.last_polled_at = Some(now_iso());
        session.record.total_polls += 1;
    })?;

    if chunk.trim().is_empty() {
        return Ok(waiting_stream_poll_result(
            session_record,
            "Waiting for new log lines.",
            warnings,
        ));
    }

    append_lines_to_session(&registry, &session_id, chunk.lines().map(str::to_string))?;
    analyze_stream_chunk(session_record, chunk, warnings)
}

#[tauri::command]
fn pick_base_asset_path(
    source_kind: String,
    initial_path: Option<String>,
) -> Result<Option<String>, String> {
    let kind = if source_kind.trim() == "directory" {
        NativePickerKind::Directory
    } else {
        NativePickerKind::File
    };
    let title = if matches!(kind, NativePickerKind::Directory) {
        "Select base asset folder"
    } else {
        "Select base asset file"
    };
    pick_native_path(kind, initial_path, title, None)
}

#[tauri::command]
fn list_tracks(app_handle: AppHandle) -> Result<Vec<LibraryTrack>, String> {
    let conn = open_database(&app_handle)?;
    read_tracks(&conn)
}

#[tauri::command]
fn list_playlists(app_handle: AppHandle) -> Result<Vec<BaseTrackPlaylist>, String> {
    let conn = open_database(&app_handle)?;
    read_playlists(&conn)
}

#[tauri::command]
fn import_track(app_handle: AppHandle, input: ImportTrackInput) -> Result<LibraryTrack, String> {
    let conn = open_database(&app_handle)?;
    let music_style_catalog = load_music_style_catalog(&repo_root());
    let managed_root = managed_tracks_root(&app_handle)?;
    insert_track(&conn, input, &music_style_catalog, &managed_root)
}

#[tauri::command]
fn save_playlist(
    app_handle: AppHandle,
    input: SaveBaseTrackPlaylistInput,
) -> Result<BaseTrackPlaylist, String> {
    let conn = open_database(&app_handle)?;
    persist_playlist(&conn, input)
}

#[tauri::command]
fn delete_playlist(app_handle: AppHandle, playlist_id: String) -> Result<(), String> {
    let conn = open_database(&app_handle)?;
    delete_playlist_record(&conn, &playlist_id)
}

#[tauri::command]
fn update_track_performance(
    app_handle: AppHandle,
    track_id: String,
    input: UpdateTrackPerformanceInput,
) -> Result<LibraryTrack, String> {
    let conn = open_database(&app_handle)?;
    persist_track_performance_update(&conn, &track_id, input)
}

#[tauri::command]
fn update_track_analysis(
    app_handle: AppHandle,
    track_id: String,
    input: UpdateTrackAnalysisInput,
) -> Result<LibraryTrack, String> {
    let conn = open_database(&app_handle)?;
    persist_track_analysis_update(&conn, &track_id, input)
}

#[tauri::command]
fn list_base_assets(app_handle: AppHandle) -> Result<Vec<BaseAssetRecord>, String> {
    let conn = open_database(&app_handle)?;
    read_base_assets(&conn)
}

#[tauri::command]
fn import_base_asset(
    app_handle: AppHandle,
    input: ImportBaseAssetInput,
) -> Result<BaseAssetRecord, String> {
    let conn = open_database(&app_handle)?;
    let category_catalog = load_base_asset_category_catalog(&repo_root());
    let managed_root = managed_base_assets_root(&app_handle)?;
    insert_base_asset(&conn, input, &category_catalog, &managed_root)
}

#[tauri::command]
fn list_compositions(app_handle: AppHandle) -> Result<Vec<CompositionResultRecord>, String> {
    let conn = open_database(&app_handle)?;
    read_compositions(&conn)
}

#[tauri::command]
fn import_composition(
    app_handle: AppHandle,
    input: ImportCompositionInput,
) -> Result<CompositionResultRecord, String> {
    let conn = open_database(&app_handle)?;
    let managed_root = managed_compositions_root(&app_handle)?;
    insert_composition(&conn, input, &managed_root)
}

#[tauri::command]
fn seed_demo_tracks(app_handle: AppHandle) -> Result<Vec<LibraryTrack>, String> {
    let conn = open_database(&app_handle)?;
    let music_style_catalog = load_music_style_catalog(&repo_root());
    let managed_root = managed_tracks_root(&app_handle)?;

    if count_tracks(&conn)? > 0 {
        return read_tracks(&conn);
    }

    for draft in [
        ImportTrackInput {
            title: "Night Drive".to_string(),
            source_path: "~/Music/night-drive.wav".to_string(),
            music_style_id: preferred_music_style_id(&music_style_catalog, "melodic-house"),
        },
        ImportTrackInput {
            title: "Circuit Azul".to_string(),
            source_path: "~/Music/circuit-azul.mp3".to_string(),
            music_style_id: preferred_music_style_id(&music_style_catalog, "house"),
        },
        ImportTrackInput {
            title: "Jakarta Pulse".to_string(),
            source_path: "~/Music/jakarta-pulse.flac".to_string(),
            music_style_id: preferred_music_style_id(&music_style_catalog, "trance"),
        },
    ] {
        insert_track(&conn, draft, &music_style_catalog, &managed_root)?;
    }

    read_tracks(&conn)
}

#[tauri::command]
fn list_repositories(app_handle: AppHandle) -> Result<Vec<RepositoryAnalysis>, String> {
    let conn = open_database(&app_handle)?;
    read_repositories(&conn)
}

#[tauri::command]
fn import_repository(
    app_handle: AppHandle,
    input: ImportRepositoryInput,
) -> Result<RepositoryAnalysis, String> {
    let conn = open_database(&app_handle)?;
    let managed_root = managed_repositories_root(&app_handle)?;
    insert_repository(&conn, input, &managed_root)
}

fn find_logs_recursive(dir: &Path, logs: &mut Vec<String>) -> std::io::Result<()> {
    if dir.is_dir() {
        // Skip hidden directories like .git or node_modules for performance
        if let Some(name) = dir.file_name().and_then(|n| n.to_str()) {
            if name.starts_with('.') || name == "node_modules" || name == "target" || name == "vendor" {
                return Ok(());
            }
        }

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                find_logs_recursive(&path, logs)?;
            } else if let Some(ext) = path.extension() {
                if ext == "log" {
                    logs.push(path.to_string_lossy().to_string());
                }
            }
            // Sanity limit to avoid UI explosion
            if logs.len() >= 50 {
                return Ok(());
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn discover_repository_logs(path: String) -> Result<Vec<String>, String> {
    let mut logs = Vec::new();
    let root = Path::new(&path);
    if !root.exists() {
        return Err(format!("Path does not exist: {path}"));
    }
    find_logs_recursive(root, &mut logs).map_err(|e| e.to_string())?;
    Ok(logs)
}

#[tauri::command]
fn pick_export_save_path(default_name: String) -> Result<Option<String>, String> {
    let home = home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|| "/tmp".to_string());
    let default_path = format!("{home}/{default_name}");
    let ext = Path::new(&default_name).extension().and_then(|e| e.to_str()).unwrap_or("*");
    let filter = format!("Export files (*.{ext})");
    pick_native_path(
        NativePickerKind::SaveFile,
        Some(default_path),
        "Choose export destination",
        Some(&filter),
    )
}

#[tauri::command]
fn pick_stems_export_directory() -> Result<Option<String>, String> {
    pick_native_path(
        NativePickerKind::Directory,
        None,
        "Choose stems output folder",
        None,
    )
}

#[tauri::command]
fn export_composition_stems(
    app_handle: AppHandle,
    composition_id: String,
    dest_dir: String,
) -> Result<Value, String> {
    // Load all compositions and find the matching one
    let conn = open_database(&app_handle)?;
    let compositions = read_compositions(&conn)?;
    let composition = compositions
        .into_iter()
        .find(|c| c.id == composition_id)
        .ok_or_else(|| format!("Composition not found: {composition_id}"))?;

    let bpm = composition.target_bpm;
    let duration_seconds = match composition.metrics.get("previewDurationSeconds") {
        Some(Value::Number(n)) => n.as_f64().unwrap_or_else(|| 64.0 * 60.0 / bpm),
        _ => 64.0 * 60.0 / bpm,
    };

    let sections_value = composition.metrics
        .get("arrangementSections")
        .cloned()
        .unwrap_or_else(|| Value::Array(vec![]));

    let render_preview_value = composition.metrics
        .get("renderPreview")
        .cloned()
        .unwrap_or_else(|| Value::Object(serde_json::Map::new()));

    let payload = json!({
        "bpm": bpm,
        "durationSeconds": duration_seconds,
        "sections": sections_value,
        "renderPreview": render_preview_value,
    });
    let payload_str = serde_json::to_string(&payload)
        .map_err(|e| format!("Failed to serialize stems payload: {e}"))?;

    let repo_root = repo_root();
    let python_bin = analyzer_python(&repo_root);
    let analyzer_src = repo_root.join("analyzer/src");

    let mut child = Command::new(python_bin)
        .arg("-m")
        .arg("maia_analyzer.cli")
        .arg("export-stems")
        .arg("--dest-dir")
        .arg(&dest_dir)
        .env("PYTHONPATH", analyzer_src.to_string_lossy().as_ref())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn analyzer for stems export: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(payload_str.as_bytes())
            .map_err(|e| format!("Failed to write stems payload: {e}"))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Stems export process error: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let response: Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Invalid JSON from stems export: {e}\nOutput: {stdout}"))?;

    if response.get("status").and_then(Value::as_str) == Some("ok") {
        Ok(response)
    } else {
        let msg = response.get("error").and_then(Value::as_str).unwrap_or("Unknown error");
        Err(format!("Stems export failed: {msg}"))
    }
}

#[tauri::command]
fn export_composition_file(source_path: String, dest_path: String) -> Result<String, String> {
    let src = Path::new(&source_path);
    if !src.exists() {
        return Err(format!("Source file does not exist: {source_path}"));
    }

    let dest = Path::new(&dest_path);
    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create destination directory: {e}"))?;
        }
    }

    fs::copy(src, dest).map_err(|e| format!("Failed to copy file: {e}"))?;
    Ok(dest_path)
}

fn execute_analyzer_request(request: &Value) -> Result<Value, String> {
    let repo_root = repo_root();
    let analyzer_src = repo_root.join("analyzer/src");
    let python_bin = analyzer_python(&repo_root);

    let mut child = Command::new(python_bin)
        .arg("-m")
        .arg("maia_analyzer.cli")
        .arg("analyze")
        .current_dir(&repo_root)
        .env("PYTHONPATH", merged_pythonpath(&analyzer_src))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Failed to start analyzer: {error}"))?;

    let request_json =
        serde_json::to_string(request).map_err(|error| format!("Invalid request JSON: {error}"))?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(request_json.as_bytes())
            .map_err(|error| format!("Failed to write request to analyzer stdin: {error}"))?;
    } else {
        return Err("Analyzer stdin is unavailable.".to_string());
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("Failed to wait for analyzer output: {error}"))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("Analyzer stdout was not valid UTF-8: {error}"))?;

    match serde_json::from_str::<Value>(&stdout) {
        Ok(value) => Ok(value),
        Err(error) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let message = stderr.trim();

            if !output.status.success() && !message.is_empty() {
                Err(message.to_string())
            } else if !output.status.success() {
                Err(format!("Analyzer exited with status {}", output.status))
            } else {
                Err(format!("Analyzer returned invalid JSON: {error}"))
            }
        }
    }
}

fn repo_root() -> PathBuf {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    root.canonicalize().unwrap_or(root)
}

fn database_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;

    Ok(app_data_dir.join("maia.sqlite3"))
}

fn managed_assets_root(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;

    Ok(app_data_dir.join("assets"))
}

fn managed_base_assets_root(app_handle: &AppHandle) -> Result<PathBuf, String> {
    Ok(managed_assets_root(app_handle)?.join("base-assets"))
}

fn managed_tracks_root(app_handle: &AppHandle) -> Result<PathBuf, String> {
    Ok(managed_assets_root(app_handle)?.join("tracks"))
}

fn managed_repositories_root(app_handle: &AppHandle) -> Result<PathBuf, String> {
    Ok(managed_assets_root(app_handle)?.join("repositories"))
}

fn managed_compositions_root(app_handle: &AppHandle) -> Result<PathBuf, String> {
    Ok(managed_assets_root(app_handle)?.join("compositions"))
}

fn expanded_input_path(raw_path: &str) -> Result<PathBuf, String> {
    let trimmed = raw_path.trim();
    if trimmed.is_empty() {
        return Err("Path is required.".to_string());
    }

    Ok(if trimmed == "~" {
        home_dir().ok_or_else(|| "Failed to resolve the home directory for `~`.".to_string())?
    } else if let Some(stripped) = trimmed.strip_prefix("~/") {
        home_dir()
            .ok_or_else(|| "Failed to resolve the home directory for `~`.".to_string())?
            .join(stripped)
    } else {
        PathBuf::from(trimmed)
    })
}

fn resolve_existing_input_path(raw_path: &str) -> Result<PathBuf, String> {
    let expanded = expanded_input_path(raw_path)?;

    expanded.canonicalize().map_err(|error| {
        format!(
            "Failed to resolve base asset path {}: {error}",
            expanded.display()
        )
    })
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .map(PathBuf::from)
}

fn copy_track_to_managed_storage(
    source_path: &str,
    managed_root: &Path,
    asset_id: &str,
) -> Result<Option<(PathBuf, PathBuf)>, String> {
    let expanded = expanded_input_path(source_path)?;
    if !expanded.exists() {
        return Ok(None);
    }

    let resolved_source = expanded.canonicalize().map_err(|error| {
        format!(
            "Failed to resolve track source path {}: {error}",
            expanded.display()
        )
    })?;
    if !resolved_source.is_file() {
        return Err(format!(
            "Selected track source is not a file: {}",
            resolved_source.display()
        ));
    }

    let asset_name = resolved_source
        .file_name()
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("track.audio"));
    let snapshot_parent = managed_root.join(asset_id);
    let managed_path = snapshot_parent.join(asset_name);

    if let Some(parent) = managed_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            format!(
                "Failed to create managed track directory {}: {error}",
                parent.display()
            )
        })?;
    }

    fs::copy(&resolved_source, &managed_path).map_err(|error| {
        format!(
            "Failed to copy track into managed storage {}: {error}",
            managed_path.display()
        )
    })?;

    Ok(Some((resolved_source, managed_path)))
}

fn copy_repository_source_to_managed_storage(
    source_kind: &str,
    source_path: &str,
    managed_root: &Path,
    asset_id: &str,
) -> Result<Option<(PathBuf, PathBuf)>, String> {
    let expanded = expanded_input_path(source_path)?;
    if !expanded.exists() {
        return Ok(None);
    }

    let resolved_source = expanded.canonicalize().map_err(|error| {
        format!(
            "Failed to resolve repository path {}: {error}",
            expanded.display()
        )
    })?;

    let asset_name = resolved_source
        .file_name()
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            if source_kind == "file" {
                PathBuf::from("log-source")
            } else {
                PathBuf::from("repository")
            }
        });
    let snapshot_parent = managed_root.join(asset_id);
    let managed_path = snapshot_parent.join(asset_name);

    if source_kind == "directory" {
        if !resolved_source.is_dir() {
            return Err(format!(
                "Selected repository source is not a directory: {}",
                resolved_source.display()
            ));
        }
        copy_directory_recursively(&resolved_source, &managed_path)?;
    } else {
        if !resolved_source.is_file() {
            return Err(format!(
                "Selected repository log source is not a file: {}",
                resolved_source.display()
            ));
        }

        if let Some(parent) = managed_path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                format!(
                    "Failed to create managed log snapshot directory {}: {error}",
                    parent.display()
                )
            })?;
        }

        fs::copy(&resolved_source, &managed_path).map_err(|error| {
            format!(
                "Failed to copy repository log source into managed storage {}: {error}",
                managed_path.display()
            )
        })?;
    }

    Ok(Some((resolved_source, managed_path)))
}

fn copy_base_asset_to_managed_storage(
    source_kind: &str,
    source_path: &str,
    managed_root: &Path,
    asset_id: &str,
) -> Result<(PathBuf, PathBuf), String> {
    let resolved_source = resolve_existing_input_path(source_path)?;
    let asset_name = resolved_source
        .file_name()
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            if source_kind == "directory" {
                PathBuf::from("base-collection")
            } else {
                PathBuf::from("base-asset")
            }
        });
    let snapshot_parent = managed_root.join(asset_id);
    let managed_path = snapshot_parent.join(asset_name);

    if let Some(parent) = managed_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            format!(
                "Failed to create managed base asset directory {}: {error}",
                parent.display()
            )
        })?;
    }

    if source_kind == "directory" {
        if !resolved_source.is_dir() {
            return Err(format!(
                "Selected base asset is not a directory: {}",
                resolved_source.display()
            ));
        }
        copy_directory_recursively(&resolved_source, &managed_path)?;
    } else {
        if !resolved_source.is_file() {
            return Err(format!(
                "Selected base asset is not a file: {}",
                resolved_source.display()
            ));
        }
        fs::copy(&resolved_source, &managed_path).map_err(|error| {
            format!(
                "Failed to copy base asset file into managed storage {}: {error}",
                managed_path.display()
            )
        })?;
    }

    Ok((resolved_source, managed_path))
}

fn copy_directory_recursively(source: &Path, destination: &Path) -> Result<(), String> {
    fs::create_dir_all(destination).map_err(|error| {
        format!(
            "Failed to create managed directory snapshot {}: {error}",
            destination.display()
        )
    })?;

    for entry in fs::read_dir(source).map_err(|error| {
        format!(
            "Failed to enumerate base asset directory {}: {error}",
            source.display()
        )
    })? {
        let entry = entry.map_err(|error| {
            format!(
                "Failed to read a base asset directory entry inside {}: {error}",
                source.display()
            )
        })?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());

        if source_path.is_dir() {
            copy_directory_recursively(&source_path, &destination_path)?;
        } else if source_path.is_file() {
            if let Some(parent) = destination_path.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    format!(
                        "Failed to prepare managed file directory {}: {error}",
                        parent.display()
                    )
                })?;
            }
            fs::copy(&source_path, &destination_path).map_err(|error| {
                format!(
                    "Failed to copy {} into managed storage {}: {error}",
                    source_path.display(),
                    destination_path.display()
                )
            })?;
        }
    }

    Ok(())
}

fn read_log_stream_chunk(
    source_path: &str,
    cursor: Option<u64>,
    max_bytes: Option<u64>,
) -> Result<(String, u64, u64, String, Vec<String>), String> {
    let resolved_source = resolve_existing_input_path(source_path)?;
    if !resolved_source.is_file() {
        return Err(format!(
            "Selected log source is not a file: {}",
            resolved_source.display()
        ));
    }

    let file_size = resolved_source
        .metadata()
        .map_err(|error| format!("Failed to stat log source {}: {error}", resolved_source.display()))?
        .len();
    let mut warnings = Vec::new();
    let start_offset = match cursor {
        Some(previous) if previous <= file_size => previous,
        Some(_) => {
            warnings.push(
                "Log file was truncated or rotated. Maia restarted live tail from the beginning."
                    .to_string(),
            );
            0
        }
        None => file_size.saturating_sub(INITIAL_LOG_TAIL_BYTES),
    };

    let max_bytes = max_bytes.unwrap_or(MAX_LOG_TAIL_READ_BYTES).max(1);
    let remaining = file_size.saturating_sub(start_offset);
    let bytes_to_read = remaining.min(max_bytes);
    if remaining > max_bytes {
        warnings.push(
            format!(
                "Large log burst detected. Maia streamed only the next {} KB in this polling window.",
                (max_bytes / 1024).max(1)
            ),
        );
    }

    let mut file = fs::File::open(&resolved_source).map_err(|error| {
        format!(
            "Failed to open log source {} for live tailing: {error}",
            resolved_source.display()
        )
    })?;
    file.seek(SeekFrom::Start(start_offset)).map_err(|error| {
        format!(
            "Failed to seek log source {}: {error}",
            resolved_source.display()
        )
    })?;

    let mut buffer = vec![0_u8; bytes_to_read as usize];
    let bytes_read = file.read(&mut buffer).map_err(|error| {
        format!(
            "Failed to read log source {}: {error}",
            resolved_source.display()
        )
    })?;
    buffer.truncate(bytes_read);
    let mut chunk = String::from_utf8_lossy(&buffer).to_string();

    if cursor.is_none() && start_offset > 0 {
        if let Some(newline_index) = chunk.find('\n') {
            chunk = chunk[(newline_index + 1)..].to_string();
        }
    }

    if start_offset == 0 && chunk.starts_with('\u{feff}') {
        chunk = chunk.trim_start_matches('\u{feff}').to_string();
    }

    let end_offset = start_offset + bytes_read as u64;

    Ok((
        resolved_source.to_string_lossy().to_string(),
        start_offset,
        end_offset,
        chunk,
        warnings,
    ))
}

fn open_database(app_handle: &AppHandle) -> Result<Connection, String> {
    let path = database_path(app_handle)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create app data directory: {error}"))?;
    }

    let conn = Connection::open(&path)
        .map_err(|error| format!("Failed to open SQLite database {}: {error}", path.display()))?;

    // Purge duplicate source_path rows before schema enforcement so the unique
    // index can be created/re-created even on databases that were written before
    // the dedup guard was in place.  Silently ignored on fresh databases where
    // the table does not exist yet.
    let _ = conn.execute_batch(
        "DELETE FROM musical_assets \
         WHERE rowid NOT IN (\
           SELECT MAX(rowid) FROM musical_assets GROUP BY source_path\
         );",
    );

    conn.execute_batch(SCHEMA_SQL)
        .map_err(|error| format!("Failed to initialize SQLite schema: {error}"))?;
    migrate_database(&conn)?;

    // Deduplicate again after migration because the migration rebuilds the table
    // without a UNIQUE constraint, which may allow duplicate rows to survive.
    let _ = conn.execute_batch(
        "DELETE FROM musical_assets \
         WHERE rowid NOT IN (\
           SELECT MAX(rowid) FROM musical_assets GROUP BY source_path\
         );",
    );

    conn.execute_batch(SCHEMA_SQL)
        .map_err(|error| format!("Failed to refresh SQLite schema after migration: {error}"))?;
    ensure_track_storage_path_column(&conn)?;
    ensure_track_library_state_rows(&conn)?;
    ensure_repository_storage_path_column(&conn)?;
    ensure_composition_export_path_column(&conn)?;
    ensure_session_playlist_column(&conn)?;
    ensure_session_bookmark_feedback_columns(&conn)?;
    ensure_session_event_parsed_lines_column(&conn)?;
    let managed_compositions_root = managed_compositions_root(app_handle)?;
    backfill_composition_export_paths(&conn, &managed_compositions_root)?;

    Ok(conn)
}

fn migrate_database(conn: &Connection) -> Result<(), String> {
    let table_sql: String = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'musical_assets'",
            [],
            |row| row.get(0),
        )
        .map_err(|error| format!("Failed to inspect SQLite schema: {error}"))?;

    if table_sql.contains("'url'") {
        return Ok(());
    }

    conn.execute_batch(
        "
        PRAGMA foreign_keys = OFF;
        BEGIN;
        CREATE TABLE musical_assets_next (
          id TEXT PRIMARY KEY,
          asset_type TEXT NOT NULL CHECK (asset_type IN ('track_analysis', 'repo_analysis', 'base_asset', 'composition_result')),
          title TEXT NOT NULL,
          source_path TEXT NOT NULL UNIQUE,
          source_kind TEXT NOT NULL CHECK (source_kind IN ('file', 'directory', 'url')),
          suggested_bpm REAL,
          confidence REAL NOT NULL DEFAULT 0,
          tags_json TEXT NOT NULL DEFAULT '[]',
          metadata_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT INTO musical_assets_next (
          id,
          asset_type,
          title,
          source_path,
          source_kind,
          suggested_bpm,
          confidence,
          tags_json,
          metadata_json,
          created_at,
          updated_at
        )
        SELECT
          id,
          asset_type,
          title,
          source_path,
          CASE
            WHEN asset_type = 'repo_analysis' AND metadata_json LIKE '%\"sourceKind\":\"url\"%' THEN 'url'
            ELSE source_kind
          END,
          suggested_bpm,
          confidence,
          tags_json,
          metadata_json,
          created_at,
          updated_at
        FROM musical_assets;
        DROP TABLE musical_assets;
        ALTER TABLE musical_assets_next RENAME TO musical_assets;
        COMMIT;
        PRAGMA foreign_keys = ON;
        ",
    )
    .map_err(|error| format!("Failed to migrate SQLite schema for repository URLs: {error}"))?;

    Ok(())
}

fn ensure_track_storage_path_column(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(track_analyses)")
        .map_err(|error| format!("Failed to inspect track_analyses columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query track_analyses columns: {error}"))?;
    let mut has_storage_path = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate track_analyses columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read track_analyses column name: {error}"))?;
        if name == "storage_path" {
            has_storage_path = true;
            break;
        }
    }

    if has_storage_path {
        return Ok(());
    }

    conn.execute_batch(
        "
        ALTER TABLE track_analyses ADD COLUMN storage_path TEXT;
        UPDATE track_analyses
        SET storage_path = (
            SELECT source_path FROM musical_assets
            WHERE musical_assets.id = track_analyses.asset_id
        )
        WHERE storage_path IS NULL OR storage_path = '';
        ",
    )
    .map_err(|error| format!("Failed to add track storage_path column: {error}"))?;

    Ok(())
}

fn ensure_track_library_state_rows(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        INSERT INTO track_library_states (
            asset_id,
            main_cue_second,
            missing_state
        )
        SELECT
            t.asset_id,
            NULL,
            CASE
                WHEN t.storage_path IS NULL OR t.storage_path = '' THEN 'missing'
                ELSE 'available'
            END
        FROM track_analyses t
        LEFT JOIN track_library_states tls ON tls.asset_id = t.asset_id
        WHERE tls.asset_id IS NULL;
        ",
    )
    .map_err(|error| format!("Failed to backfill track library state rows: {error}"))?;

    Ok(())
}

fn ensure_repository_storage_path_column(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(repo_analyses)")
        .map_err(|error| format!("Failed to inspect repo_analyses columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query repo_analyses columns: {error}"))?;
    let mut has_storage_path = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate repo_analyses columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read repo_analyses column name: {error}"))?;
        if name == "storage_path" {
            has_storage_path = true;
            break;
        }
    }

    if has_storage_path {
        return Ok(());
    }

    conn.execute_batch(
        "
        ALTER TABLE repo_analyses ADD COLUMN storage_path TEXT;
        UPDATE repo_analyses
        SET storage_path = repo_path
        WHERE (storage_path IS NULL OR storage_path = '')
          AND asset_id IN (
            SELECT id FROM musical_assets
            WHERE asset_type = 'repo_analysis' AND source_kind = 'directory'
          );
        ",
    )
    .map_err(|error| format!("Failed to add repository storage_path column: {error}"))?;

    Ok(())
}

fn ensure_composition_export_path_column(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(composition_results)")
        .map_err(|error| format!("Failed to inspect composition_results columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query composition_results columns: {error}"))?;
    let mut has_export_path = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate composition_results columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read composition_results column name: {error}"))?;
        if name == "export_path" {
            has_export_path = true;
            break;
        }
    }

    if has_export_path {
        return Ok(());
    }

    conn.execute_batch("ALTER TABLE composition_results ADD COLUMN export_path TEXT;")
        .map_err(|error| format!("Failed to add composition export_path column: {error}"))?;

    Ok(())
}

fn ensure_session_playlist_column(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(sessions)")
        .map_err(|error| format!("Failed to inspect sessions columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query sessions columns: {error}"))?;
    let mut has_playlist_id = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate sessions columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read sessions column name: {error}"))?;
        if name == "playlist_id" {
            has_playlist_id = true;
            break;
        }
    }

    if has_playlist_id {
        return Ok(());
    }

    conn.execute_batch("ALTER TABLE sessions ADD COLUMN playlist_id TEXT;")
        .map_err(|error| format!("Failed to add sessions playlist_id column: {error}"))?;

    Ok(())
}

fn ensure_session_bookmark_feedback_columns(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(session_bookmarks)")
        .map_err(|error| format!("Failed to inspect session_bookmarks columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query session_bookmarks columns: {error}"))?;
    let mut has_bookmark_tag = false;
    let mut has_suggested_style_profile_id = false;
    let mut has_suggested_mutation_profile_id = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate session_bookmarks columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read session_bookmarks column name: {error}"))?;
        match name.as_str() {
            "bookmark_tag" => has_bookmark_tag = true,
            "suggested_style_profile_id" => has_suggested_style_profile_id = true,
            "suggested_mutation_profile_id" => has_suggested_mutation_profile_id = true,
            _ => {}
        }
    }

    if !has_bookmark_tag {
        conn.execute_batch("ALTER TABLE session_bookmarks ADD COLUMN bookmark_tag TEXT;")
            .map_err(|error| format!("Failed to add session_bookmarks bookmark_tag column: {error}"))?;
    }

    if !has_suggested_style_profile_id {
        conn.execute_batch(
            "ALTER TABLE session_bookmarks ADD COLUMN suggested_style_profile_id TEXT;",
        )
        .map_err(|error| {
            format!(
                "Failed to add session_bookmarks suggested_style_profile_id column: {error}"
            )
        })?;
    }

    if !has_suggested_mutation_profile_id {
        conn.execute_batch(
            "ALTER TABLE session_bookmarks ADD COLUMN suggested_mutation_profile_id TEXT;",
        )
        .map_err(|error| {
            format!(
                "Failed to add session_bookmarks suggested_mutation_profile_id column: {error}"
            )
        })?;
    }

    Ok(())
}

fn ensure_session_event_parsed_lines_column(conn: &Connection) -> Result<(), String> {
    let mut statement = conn
        .prepare("PRAGMA table_info(session_events)")
        .map_err(|error| format!("Failed to inspect session_events columns: {error}"))?;
    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query session_events columns: {error}"))?;
    let mut has_parsed_lines_json = false;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate session_events columns: {error}"))?
    {
        let name: String = row
            .get(1)
            .map_err(|error| format!("Failed to read session_events column name: {error}"))?;
        if name == "parsed_lines_json" {
            has_parsed_lines_json = true;
            break;
        }
    }

    if has_parsed_lines_json {
        return Ok(());
    }

    conn.execute_batch(
        "ALTER TABLE session_events ADD COLUMN parsed_lines_json TEXT NOT NULL DEFAULT '[]';",
    )
    .map_err(|error| format!("Failed to add session_events parsed_lines_json column: {error}"))?;

    Ok(())
}

fn composition_export_note(export_path: &str) -> String {
    format!("Managed composition plan snapshot written to {export_path}.")
}

fn composition_preview_audio_note(preview_audio_path: &str) -> String {
    format!("Managed preview audio rendered to {preview_audio_path}.")
}

fn composition_metadata_from_record(composition: &CompositionResultRecord) -> CompositionMetadata {
    CompositionMetadata {
        base_asset_id: composition.base_asset_id.clone(),
        base_asset_title: composition.base_asset_title.clone(),
        base_asset_category_id: composition.base_asset_category_id.clone(),
        base_asset_category_label: composition.base_asset_category_label.clone(),
        base_playlist_id: composition.base_playlist_id.clone(),
        base_playlist_name: composition.base_playlist_name.clone(),
        reference_type: composition.reference_type.clone(),
        reference_asset_id: composition.reference_asset_id.clone(),
        reference_title: composition.reference_title.clone(),
        reference_source_path: composition.reference_source_path.clone(),
        analyzer_status: composition.analyzer_status.clone(),
        strategy: composition.strategy.clone(),
        summary: composition.summary.clone(),
        notes: composition.notes.clone(),
        tags: composition.tags.clone(),
        metrics: composition.metrics.clone(),
    }
}

fn apply_composition_export_metadata(
    composition: &mut CompositionResultRecord,
    export_path: String,
) {
    let export_note = composition_export_note(&export_path);
    composition.export_path = Some(export_path.clone());

    if !composition.notes.iter().any(|note| note == &export_note) {
        composition.notes.push(export_note);
    }

    if !composition.metrics.is_object() {
        composition.metrics = json!({});
    }

    if let Some(metrics) = composition.metrics.as_object_mut() {
        metrics.insert("managedPlanPath".to_string(), Value::String(export_path));
        metrics.insert(
            "storageMode".to_string(),
            Value::String("managed-plan".to_string()),
        );
    }
}

fn apply_composition_preview_audio_metadata(
    composition: &mut CompositionResultRecord,
    preview_audio_path: &str,
) {
    let preview_note = composition_preview_audio_note(preview_audio_path);
    composition.preview_audio_path = Some(preview_audio_path.to_string());

    if !composition.notes.iter().any(|note| note == &preview_note) {
        composition.notes.push(preview_note);
    }
}

fn write_composition_snapshot(
    composition: &CompositionResultRecord,
    managed_root: &Path,
) -> Result<String, String> {
    let snapshot_dir = managed_root.join(&composition.id);
    fs::create_dir_all(&snapshot_dir).map_err(|error| {
        format!(
            "Failed to create managed composition directory {}: {error}",
            snapshot_dir.display()
        )
    })?;

    let snapshot_path = snapshot_dir.join("plan.json");
    let snapshot_path_string = snapshot_path.display().to_string();
    let payload = json!({
        "contractVersion": CONTRACT_VERSION,
        "compositionId": &composition.id,
        "snapshotPath": &snapshot_path_string,
        "title": &composition.title,
        "createdAt": &composition.imported_at,
        "source": {
            "path": &composition.source_path,
            "kind": &composition.source_kind
        },
        "baseAsset": {
            "id": &composition.base_asset_id,
            "title": &composition.base_asset_title,
            "categoryId": &composition.base_asset_category_id,
            "categoryLabel": &composition.base_asset_category_label
        },
        "reference": {
            "type": &composition.reference_type,
            "assetId": &composition.reference_asset_id,
            "title": &composition.reference_title,
            "sourcePath": &composition.reference_source_path
        },
        "plan": {
            "targetBpm": composition.target_bpm,
            "confidence": composition.confidence,
            "strategy": &composition.strategy,
            "summary": &composition.summary,
            "analyzerStatus": &composition.analyzer_status,
            "notes": &composition.notes,
            "tags": &composition.tags,
            "metrics": &composition.metrics,
            "waveformBins": &composition.waveform_bins,
            "beatGrid": &composition.beat_grid,
            "bpmCurve": &composition.bpm_curve
        }
    });
    let serialized = serde_json::to_string_pretty(&payload)
        .map_err(|error| format!("Failed to encode composition snapshot JSON: {error}"))?;
    fs::write(&snapshot_path, serialized).map_err(|error| {
        format!(
            "Failed to write managed composition snapshot {}: {error}",
            snapshot_path.display()
        )
    })?;

    Ok(snapshot_path_string)
}

fn backfill_composition_export_paths(conn: &Connection, managed_root: &Path) -> Result<(), String> {
    let compositions = read_compositions(conn)?;

    for mut composition in compositions.into_iter().filter(|entry| {
        entry
            .export_path
            .as_deref()
            .map(str::trim)
            .unwrap_or_default()
            .is_empty()
    }) {
        let export_path = write_composition_snapshot(&composition, managed_root)?;
        apply_composition_export_metadata(&mut composition, export_path.clone());
        let metadata_json = serde_json::to_string(&composition_metadata_from_record(&composition))
            .map_err(|error| {
                format!("Failed to encode composition metadata for backfill: {error}")
            })?;
        let updated_at = now_millis().to_string();

        conn.execute(
            "
            UPDATE composition_results
            SET export_path = ?2
            WHERE asset_id = ?1
            ",
            params![&composition.id, export_path],
        )
        .map_err(|error| format!("Failed to backfill composition export path: {error}"))?;

        conn.execute(
            "
            UPDATE musical_assets
            SET metadata_json = ?2, updated_at = ?3
            WHERE id = ?1
            ",
            params![&composition.id, metadata_json, updated_at],
        )
        .map_err(|error| format!("Failed to backfill composition metadata: {error}"))?;
    }

    Ok(())
}

fn merged_pythonpath(analyzer_src: &Path) -> String {
    let separator = if cfg!(target_os = "windows") {
        ";"
    } else {
        ":"
    };
    let analyzer_src = analyzer_src.display().to_string();

    match env::var("PYTHONPATH") {
        Ok(existing) if !existing.is_empty() => format!("{analyzer_src}{separator}{existing}"),
        _ => analyzer_src,
    }
}

fn analyzer_python(repo_root: &Path) -> String {
    if let Ok(python_bin) = env::var("MAIA_PYTHON") {
        if !python_bin.is_empty() {
            return python_bin;
        }
    }

    let candidates = if cfg!(target_os = "windows") {
        vec![
            repo_root.join("analyzer/.venv/Scripts/python.exe"),
            repo_root.join("analyzer/.venv/bin/python.exe"),
        ]
    } else {
        vec![
            repo_root.join("analyzer/.venv/bin/python"),
            repo_root.join("analyzer/.venv/bin/python3"),
        ]
    };

    for candidate in candidates {
        if candidate.exists() {
            return candidate.display().to_string();
        }
    }

    if cfg!(target_os = "windows") {
        "python".to_string()
    } else {
        "python3".to_string()
    }
}

fn pick_native_path(
    kind: NativePickerKind,
    initial_path: Option<String>,
    title: &str,
    filter: Option<&str>,
) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let default_path = picker_default_path(initial_path);

        match pick_with_kdialog(&kind, &default_path, title, filter)? {
            PickerOutcome::Selected(path) => return Ok(Some(path)),
            PickerOutcome::Cancelled => return Ok(None),
            PickerOutcome::NotFound => {}
        }

        match pick_with_zenity(&kind, &default_path, title, filter)? {
            PickerOutcome::Selected(path) => return Ok(Some(path)),
            PickerOutcome::Cancelled => return Ok(None),
            PickerOutcome::NotFound => {}
        }

        return Err(
            "No supported native picker found. Install kdialog or zenity, or enter the path manually."
                .to_string(),
        );
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = kind;
        let _ = initial_path;
        let _ = title;
        let _ = filter;
        Err("Native picker support is currently implemented for Linux only. Enter the path manually.".to_string())
    }
}

#[cfg(target_os = "linux")]
enum PickerOutcome {
    Selected(String),
    Cancelled,
    NotFound,
}

#[cfg(target_os = "linux")]
fn pick_with_kdialog(
    kind: &NativePickerKind,
    default_path: &str,
    title: &str,
    filter: Option<&str>,
) -> Result<PickerOutcome, String> {
    let mut args = vec!["--title", title];

    match kind {
        NativePickerKind::File => {
            args.push("--getopenfilename");
            args.push(default_path);
            if let Some(filter) = filter {
                args.push(filter);
            }
        }
        NativePickerKind::Directory => {
            args.push("--getexistingdirectory");
            args.push(default_path);
        }
        NativePickerKind::SaveFile => {
            args.push("--getsavefilename");
            args.push(default_path);
            if let Some(filter) = filter {
                args.push(filter);
            }
        }
    }

    run_native_picker_command("kdialog", &args)
}

#[cfg(target_os = "linux")]
fn pick_with_zenity(
    kind: &NativePickerKind,
    default_path: &str,
    title: &str,
    filter: Option<&str>,
) -> Result<PickerOutcome, String> {
    let mut args = vec![
        "--file-selection",
        "--title",
        title,
        "--filename",
        default_path,
    ];

    if matches!(kind, NativePickerKind::Directory) {
        args.push("--directory");
    }

    if matches!(kind, NativePickerKind::SaveFile) {
        args.push("--save");
    }

    if let Some(filter) = filter {
        args.push("--file-filter");
        args.push(filter);
    }

    run_native_picker_command("zenity", &args)
}

#[cfg(target_os = "linux")]
fn run_native_picker_command(command: &str, args: &[&str]) -> Result<PickerOutcome, String> {
    let output = match Command::new(command).args(args).output() {
        Ok(output) => output,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(PickerOutcome::NotFound),
        Err(error) => return Err(format!("Failed to launch {command}: {error}")),
    };

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("{command} returned invalid UTF-8: {error}"))?;
    let selected = stdout.trim().to_string();

    if output.status.success() {
        if selected.is_empty() {
            return Ok(PickerOutcome::Cancelled);
        }

        return Ok(PickerOutcome::Selected(selected));
    }

    // Non-zero exit with empty stdout means user cancelled (e.g. kdialog cancel button).
    if selected.is_empty() {
        return Ok(PickerOutcome::Cancelled);
    }

    let stderr = String::from_utf8(output.stderr)
        .map_err(|error| format!("{command} returned invalid stderr UTF-8: {error}"))?;

    Err(format!(
        "{command} failed with status {}: {}",
        output
            .status
            .code()
            .map(|code| code.to_string())
            .unwrap_or_else(|| "signal".to_string()),
        stderr.trim()
    ))
}

fn picker_default_path(initial_path: Option<String>) -> String {
    // If the caller provides an existing path, use its parent dir so the
    // picker opens in the same folder as the previously selected file.
    if let Some(p) = initial_path.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let pb = PathBuf::from(p);
        let dir = if pb.is_dir() { pb } else { pb.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::from(p)) };
        if dir.exists() {
            return dir.to_string_lossy().to_string();
        }
    }

    // Prefer ~/Music then ~/Música then $HOME.
    if let Some(home) = home_dir() {
        for subdir in &["Music", "Música", "music", "musica"] {
            let candidate = home.join(subdir);
            if candidate.is_dir() {
                return candidate.to_string_lossy().to_string();
            }
        }
        return home.to_string_lossy().to_string();
    }

    repo_root().display().to_string()
}

fn music_style_config_path(repo_root: &Path) -> PathBuf {
    repo_root.join("desktop/src/config/music-styles.json")
}

fn base_asset_category_config_path(repo_root: &Path) -> PathBuf {
    repo_root.join("desktop/src/config/base-asset-categories.json")
}

fn fallback_music_style_catalog() -> MusicStyleCatalog {
    serde_json::from_str(DEFAULT_MUSIC_STYLE_CATALOG_JSON)
        .expect("embedded music style catalog should be valid JSON")
}

fn fallback_base_asset_category_catalog() -> BaseAssetCategoryCatalog {
    serde_json::from_str(DEFAULT_BASE_ASSET_CATEGORY_CATALOG_JSON)
        .expect("embedded base asset category catalog should be valid JSON")
}

fn load_music_style_catalog(repo_root: &Path) -> MusicStyleCatalog {
    let config_path = music_style_config_path(repo_root);
    let raw_catalog = fs::read_to_string(&config_path)
        .ok()
        .filter(|contents| !contents.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_MUSIC_STYLE_CATALOG_JSON.to_string());

    serde_json::from_str(&raw_catalog)
        .ok()
        .filter(|catalog: &MusicStyleCatalog| {
            !catalog.music_styles.is_empty()
                && catalog
                    .music_styles
                    .iter()
                    .any(|style| style.id == catalog.default_track_music_style_id)
        })
        .unwrap_or_else(fallback_music_style_catalog)
}

fn load_base_asset_category_catalog(repo_root: &Path) -> BaseAssetCategoryCatalog {
    let config_path = base_asset_category_config_path(repo_root);
    let raw_catalog = fs::read_to_string(&config_path)
        .ok()
        .filter(|contents| !contents.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_BASE_ASSET_CATEGORY_CATALOG_JSON.to_string());

    serde_json::from_str(&raw_catalog)
        .ok()
        .filter(|catalog: &BaseAssetCategoryCatalog| {
            !catalog.base_asset_categories.is_empty()
                && catalog
                    .base_asset_categories
                    .iter()
                    .any(|category| category.id == catalog.default_base_asset_category_id)
        })
        .unwrap_or_else(fallback_base_asset_category_catalog)
}

fn preferred_music_style_id(catalog: &MusicStyleCatalog, preferred_id: &str) -> String {
    if catalog
        .music_styles
        .iter()
        .any(|style| style.id == preferred_id)
    {
        return preferred_id.to_string();
    }

    catalog.default_track_music_style_id.clone()
}

fn normalized_music_style_id(metadata: &TrackMetadata) -> String {
    let music_style_id = if !metadata.tags.music_style_id.trim().is_empty() {
        metadata.tags.music_style_id.trim()
    } else {
        metadata.music_style_id.trim()
    };
    if music_style_id.is_empty() {
        "not-set".to_string()
    } else {
        music_style_id.to_string()
    }
}

fn normalized_music_style_label(metadata: &TrackMetadata) -> String {
    let music_style_label = if !metadata.tags.music_style_label.trim().is_empty() {
        metadata.tags.music_style_label.trim()
    } else {
        metadata.music_style_label.trim()
    };
    if !music_style_label.is_empty() {
        return music_style_label.to_string();
    }

    let music_style_id = metadata.music_style_id.trim();
    if music_style_id.is_empty() {
        "Not set".to_string()
    } else {
        music_style_id.replace('-', " ")
    }
}

fn normalized_base_asset_category_id(metadata: &BaseAssetMetadata) -> String {
    let category_id = metadata.category_id.trim();
    if category_id.is_empty() {
        "not-set".to_string()
    } else {
        category_id.to_string()
    }
}

fn normalized_base_asset_category_label(metadata: &BaseAssetMetadata) -> String {
    let category_label = metadata.category_label.trim();
    if !category_label.is_empty() {
        return category_label.to_string();
    }

    let category_id = metadata.category_id.trim();
    if category_id.is_empty() {
        "Not set".to_string()
    } else {
        category_id.replace('-', " ")
    }
}

fn normalized_analysis_mode(metadata: &TrackMetadata) -> String {
    let analysis_mode = if !metadata.analysis.analysis_mode.trim().is_empty() {
        metadata.analysis.analysis_mode.trim()
    } else {
        metadata.analysis_mode.trim()
    };
    if analysis_mode.is_empty() {
        "unknown".to_string()
    } else {
        analysis_mode.to_string()
    }
}

fn normalized_file_extension(metadata: &TrackMetadata) -> String {
    let file_extension = if !metadata.file.file_extension.trim().is_empty() {
        metadata.file.file_extension.trim()
    } else {
        metadata.file_extension.trim()
    };
    if file_extension.is_empty() {
        ".audio".to_string()
    } else {
        file_extension.to_string()
    }
}

fn normalized_analyzer_status(metadata: &TrackMetadata) -> String {
    let analyzer_status = if !metadata.analysis.analyzer_status.trim().is_empty() {
        metadata.analysis.analyzer_status.trim()
    } else {
        metadata.analyzer_status.trim()
    };
    if analyzer_status.is_empty() {
        "Unknown analyzer status".to_string()
    } else {
        analyzer_status.to_string()
    }
}

fn normalized_repo_suggested_status(metadata: &TrackMetadata) -> String {
    let repo_suggested_status = if !metadata.analysis.repo_suggested_status.trim().is_empty() {
        metadata.analysis.repo_suggested_status.trim()
    } else {
        metadata.repo_suggested_status.trim()
    };
    if repo_suggested_status.is_empty() {
        "Waiting for repository heuristics in a future analyzer pass".to_string()
    } else {
        repo_suggested_status.to_string()
    }
}

fn resolved_track_notes(metadata: &TrackMetadata) -> Vec<String> {
    if !metadata.analysis.notes.is_empty() {
        metadata.analysis.notes.clone()
    } else {
        metadata.notes.clone()
    }
}

fn resolved_track_key_signature(metadata: &TrackMetadata) -> Option<String> {
    metadata
        .analysis
        .key_signature
        .clone()
        .or_else(|| metadata.key_signature.clone())
}

fn resolved_track_energy_level(metadata: &TrackMetadata) -> Option<f64> {
    metadata.analysis.energy_level.or(metadata.energy_level)
}

fn resolved_track_danceability(metadata: &TrackMetadata) -> Option<f64> {
    metadata.analysis.danceability.or(metadata.danceability)
}

fn resolved_structural_patterns(metadata: &TrackMetadata) -> Vec<TrackStructuralPattern> {
    if !metadata.analysis.structural_patterns.is_empty() {
        metadata.analysis.structural_patterns.clone()
    } else {
        metadata.structural_patterns.clone()
    }
}

fn count_tracks(conn: &Connection) -> Result<i64, String> {
    conn.query_row(
        "SELECT COUNT(*) FROM musical_assets WHERE asset_type = 'track_analysis'",
        [],
        |row| row.get(0),
    )
    .map_err(|error| format!("Failed to count tracks: {error}"))
}

fn path_is_file(path: &str) -> bool {
    if path.trim().is_empty() {
        return false;
    }
    Path::new(path).is_file()
}

fn file_modified_millis(path: &Path) -> Option<String> {
    fs::metadata(path)
        .ok()
        .and_then(|metadata| metadata.modified().ok())
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis().to_string())
}

fn file_size_bytes(path: &Path) -> Option<i64> {
    fs::metadata(path)
        .ok()
        .filter(|metadata| metadata.is_file())
        .map(|metadata| metadata.len() as i64)
}

fn probe_track_file_state(
    source_path: &str,
    storage_path: Option<&str>,
    fallback_size_bytes: Option<i64>,
    fallback_modified_at: Option<String>,
) -> (Option<i64>, Option<String>, String, String) {
    let storage_existing = storage_path.filter(|path| path_is_file(path));
    let source_existing = if path_is_file(source_path) {
        Some(source_path)
    } else {
        None
    };
    let active_path = storage_existing.or(source_existing);
    let size_bytes = active_path
        .and_then(|path| file_size_bytes(Path::new(path)))
        .or(fallback_size_bytes);
    let modified_at = active_path
        .and_then(|path| file_modified_millis(Path::new(path)))
        .or(fallback_modified_at);
    let availability_state = if active_path.is_some() {
        "available".to_string()
    } else {
        "missing".to_string()
    };
    let playback_source = if storage_existing.is_some() {
        "managed_snapshot".to_string()
    } else if source_existing.is_some() {
        "source_file".to_string()
    } else {
        "unavailable".to_string()
    };

    (size_bytes, modified_at, availability_state, playback_source)
}

fn default_track_hot_cues(
    structural_patterns: &[TrackStructuralPattern],
) -> Vec<TrackCuePoint> {
    let colors = ["#f59e0b", "#22d3ee", "#ef4444", "#8b5cf6"];

    structural_patterns
        .iter()
        .take(4)
        .enumerate()
        .map(|(index, pattern)| TrackCuePoint {
            id: format!("hot-cue-{}", index + 1),
            slot: Some((index + 1) as u32),
            second: pattern.start,
            label: pattern.label.clone(),
            kind: "hot".to_string(),
            color: Some(colors[index].to_string()),
        })
        .collect()
}

fn default_track_library_state(
    beat_grid: &[BeatGridPoint],
    structural_patterns: &[TrackStructuralPattern],
    file_size_bytes: Option<i64>,
    source_modified_at: Option<String>,
    missing_state: String,
) -> TrackLibraryStateDb {
    TrackLibraryStateDb {
        color: None,
        rating: 0,
        play_count: 0,
        last_played_at: None,
        bpm_lock: false,
        grid_lock: false,
        main_cue_second: beat_grid.first().map(|point| point.second),
        hot_cues: default_track_hot_cues(structural_patterns),
        memory_cues: Vec::new(),
        saved_loops: Vec::new(),
        missing_state,
        file_size_bytes,
        source_modified_at,
        source_checksum: None,
    }
}

fn track_library_state_from_track(track: &LibraryTrack) -> TrackLibraryStateDb {
    TrackLibraryStateDb {
        color: track.performance.color.clone(),
        rating: track.performance.rating,
        play_count: track.performance.play_count,
        last_played_at: track.performance.last_played_at.clone(),
        bpm_lock: track.performance.bpm_lock,
        grid_lock: track.performance.grid_lock,
        main_cue_second: track.performance.main_cue_second,
        hot_cues: track.performance.hot_cues.clone(),
        memory_cues: track.performance.memory_cues.clone(),
        saved_loops: track.performance.saved_loops.clone(),
        missing_state: track.file.availability_state.clone(),
        file_size_bytes: track.file.size_bytes,
        source_modified_at: track.file.modified_at.clone(),
        source_checksum: track.file.checksum.clone(),
    }
}

fn track_metadata_from_track(track: &LibraryTrack) -> TrackMetadata {
    TrackMetadata {
        file: TrackFileMetadata {
            source_kind: track.file.source_kind.clone(),
            file_extension: track.file.file_extension.clone(),
            size_bytes: track.file.size_bytes,
            modified_at: track.file.modified_at.clone(),
            checksum: track.file.checksum.clone(),
        },
        tags: TrackTagsMetadata {
            title: Some(track.tags.title.clone()),
            artist: track.tags.artist.clone(),
            album: track.tags.album.clone(),
            genre: track.tags.genre.clone(),
            year: track.tags.year,
            comment: track.tags.comment.clone(),
            artwork_path: track.tags.artwork_path.clone(),
            music_style_id: track.tags.music_style_id.clone(),
            music_style_label: track.tags.music_style_label.clone(),
        },
        analysis: TrackAnalysisMetadata {
            analyzer_status: track.analysis.analyzer_status.clone(),
            analysis_mode: track.analysis.analysis_mode.clone(),
            analyzer_version: track.analysis.analyzer_version.clone(),
            analyzed_at: track.analysis.analyzed_at.clone(),
            repo_suggested_bpm: track.analysis.repo_suggested_bpm,
            repo_suggested_status: track.analysis.repo_suggested_status.clone(),
            notes: track.analysis.notes.clone(),
            key_signature: track.analysis.key_signature.clone(),
            energy_level: track.analysis.energy_level,
            danceability: track.analysis.danceability,
            structural_patterns: track.analysis.structural_patterns.clone(),
        },
        file_extension: track.file.file_extension.clone(),
        analyzer_status: track.analysis.analyzer_status.clone(),
        analysis_mode: track.analysis.analysis_mode.clone(),
        repo_suggested_bpm: track.analysis.repo_suggested_bpm,
        repo_suggested_status: track.analysis.repo_suggested_status.clone(),
        notes: track.analysis.notes.clone(),
        music_style_id: track.tags.music_style_id.clone(),
        music_style_label: track.tags.music_style_label.clone(),
        key_signature: track.analysis.key_signature.clone(),
        energy_level: track.analysis.energy_level,
        danceability: track.analysis.danceability,
        structural_patterns: track.analysis.structural_patterns.clone(),
    }
}

fn normalize_beat_grid_points(
    points: Vec<BeatGridPoint>,
    duration_seconds: Option<f64>,
) -> Vec<BeatGridPoint> {
    let max_duration = duration_seconds.unwrap_or(f64::INFINITY);
    let mut normalized: Vec<BeatGridPoint> = points
        .into_iter()
        .filter(|point| {
            point.second.is_finite() && point.second >= 0.0 && point.second <= max_duration
        })
        .collect();

    normalized.sort_by(|left, right| {
        left.second
            .partial_cmp(&right.second)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    normalized
        .into_iter()
        .fold(Vec::<BeatGridPoint>::new(), |mut acc, point| {
            let duplicate = acc
                .last()
                .map(|last| (last.second - point.second).abs() <= 0.0005)
                .unwrap_or(false);
            if !duplicate {
                acc.push(BeatGridPoint {
                    index: acc.len() as u32,
                    second: (point.second * 1000.0).round() / 1000.0,
                });
            }
            acc
        })
}

fn normalize_bpm_curve_points(
    points: Vec<BpmCurvePoint>,
    duration_seconds: Option<f64>,
) -> Vec<BpmCurvePoint> {
    let max_duration = duration_seconds.unwrap_or(f64::INFINITY);
    let mut normalized: Vec<BpmCurvePoint> = points
        .into_iter()
        .filter(|point| {
            point.second.is_finite() && point.bpm.is_finite() && point.second >= 0.0
                && point.second <= max_duration
        })
        .collect();

    normalized.sort_by(|left, right| {
        left.second
            .partial_cmp(&right.second)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    normalized
        .into_iter()
        .fold(Vec::<BpmCurvePoint>::new(), |mut acc, point| {
            let duplicate = acc
                .last()
                .map(|last| (last.second - point.second).abs() <= 0.0005)
                .unwrap_or(false);
            if !duplicate {
                acc.push(BpmCurvePoint {
                    second: (point.second * 1000.0).round() / 1000.0,
                    bpm: (point.bpm * 1000.0).round() / 1000.0,
                });
            }
            acc
        })
}

fn decode_track_row(row: &rusqlite::Row<'_>) -> Result<LibraryTrack, String> {
    let metadata_json: String = row
        .get(6)
        .map_err(|error| format!("Failed to read track metadata: {error}"))?;
    let title: String = row
        .get(1)
        .map_err(|error| format!("Failed to read track title: {error}"))?;
    let source_path: String = row
        .get(2)
        .map_err(|error| format!("Failed to read track source path: {error}"))?;
    let storage_path: Option<String> = row
        .get(7)
        .map_err(|error| format!("Failed to read track storage path: {error}"))?;
    let imported_at: String = row
        .get(5)
        .map_err(|error| format!("Failed to read import timestamp: {error}"))?;
    let waveform_json: String = row
        .get(9)
        .map_err(|error| format!("Failed to read waveform bins: {error}"))?;
    let beat_grid_json: String = row
        .get(10)
        .map_err(|error| format!("Failed to read beat grid: {error}"))?;
    let bpm_curve_json: String = row
        .get(11)
        .map_err(|error| format!("Failed to read BPM curve: {error}"))?;
    let metadata: TrackMetadata = serde_json::from_str(&metadata_json)
        .map_err(|error| format!("Failed to decode track metadata JSON: {error}"))?;
    let waveform_bins: Vec<f64> = serde_json::from_str(&waveform_json)
        .map_err(|error| format!("Failed to decode waveform JSON: {error}"))?;
    let beat_grid: Vec<BeatGridPoint> = serde_json::from_str(&beat_grid_json)
        .map_err(|error| format!("Failed to decode beat grid JSON: {error}"))?;
    let bpm_curve: Vec<BpmCurvePoint> = serde_json::from_str(&bpm_curve_json)
        .map_err(|error| format!("Failed to decode BPM curve JSON: {error}"))?;
    let music_style_id = normalized_music_style_id(&metadata);
    let music_style_label = normalized_music_style_label(&metadata);
    let analysis_mode = normalized_analysis_mode(&metadata);
    let file_extension = normalized_file_extension(&metadata);
    let analyzer_status = normalized_analyzer_status(&metadata);
    let repo_suggested_bpm = metadata
        .analysis
        .repo_suggested_bpm
        .or(metadata.repo_suggested_bpm);
    let repo_suggested_status = normalized_repo_suggested_status(&metadata);
    let notes = resolved_track_notes(&metadata);
    let key_signature = resolved_track_key_signature(&metadata);
    let energy_level = resolved_track_energy_level(&metadata);
    let danceability = resolved_track_danceability(&metadata);
    let structural_patterns = resolved_structural_patterns(&metadata);
    let row_file_size_bytes: Option<i64> = row
        .get(23)
        .map_err(|error| format!("Failed to read track file size: {error}"))?;
    let row_source_modified_at: Option<String> = row
        .get(24)
        .map_err(|error| format!("Failed to read track modified timestamp: {error}"))?;
    let row_source_checksum: Option<String> = row
        .get(25)
        .map_err(|error| format!("Failed to read track checksum: {error}"))?;
    let (size_bytes, modified_at, availability_state, playback_source) = probe_track_file_state(
        &source_path,
        storage_path.as_deref(),
        row_file_size_bytes,
        row_source_modified_at.clone(),
    );
    let hot_cues = row
        .get::<_, Option<String>>(19)
        .map_err(|error| format!("Failed to read hot cues JSON: {error}"))?
        .map(|value| serde_json::from_str::<Vec<TrackCuePoint>>(&value))
        .transpose()
        .map_err(|error| format!("Failed to decode hot cues JSON: {error}"))?
        .unwrap_or_default();
    let memory_cues = row
        .get::<_, Option<String>>(20)
        .map_err(|error| format!("Failed to read memory cues JSON: {error}"))?
        .map(|value| serde_json::from_str::<Vec<TrackCuePoint>>(&value))
        .transpose()
        .map_err(|error| format!("Failed to decode memory cues JSON: {error}"))?
        .unwrap_or_default();
    let saved_loops = row
        .get::<_, Option<String>>(21)
        .map_err(|error| format!("Failed to read saved loops JSON: {error}"))?
        .map(|value| serde_json::from_str::<Vec<TrackSavedLoop>>(&value))
        .transpose()
        .map_err(|error| format!("Failed to decode saved loops JSON: {error}"))?
        .unwrap_or_default();
    let performance_defaults = default_track_library_state(
        &beat_grid,
        &structural_patterns,
        size_bytes,
        modified_at.clone(),
        availability_state.clone(),
    );
    let performance = TrackPerformanceInfo {
        color: row
            .get(12)
            .map_err(|error| format!("Failed to read track color: {error}"))?,
        rating: row
            .get::<_, Option<i64>>(13)
            .map_err(|error| format!("Failed to read track rating: {error}"))?
            .unwrap_or(performance_defaults.rating),
        play_count: row
            .get::<_, Option<i64>>(14)
            .map_err(|error| format!("Failed to read track play count: {error}"))?
            .unwrap_or(performance_defaults.play_count),
        last_played_at: row
            .get(15)
            .map_err(|error| format!("Failed to read track last-played timestamp: {error}"))?,
        bpm_lock: row
            .get::<_, Option<i64>>(16)
            .map_err(|error| format!("Failed to read track BPM lock: {error}"))?
            .unwrap_or(if performance_defaults.bpm_lock { 1 } else { 0 })
            != 0,
        grid_lock: row
            .get::<_, Option<i64>>(17)
            .map_err(|error| format!("Failed to read track grid lock: {error}"))?
            .unwrap_or(if performance_defaults.grid_lock { 1 } else { 0 })
            != 0,
        main_cue_second: row
            .get::<_, Option<f64>>(18)
            .map_err(|error| format!("Failed to read track main cue second: {error}"))?
            .or(performance_defaults.main_cue_second),
        hot_cues: if hot_cues.is_empty() {
            performance_defaults.hot_cues.clone()
        } else {
            hot_cues
        },
        memory_cues,
        saved_loops,
    };
    let track_title = metadata
        .tags
        .title
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| title.clone());
    let track_tags = TrackTagsInfo {
        title: track_title.clone(),
        artist: metadata.tags.artist.clone(),
        album: metadata.tags.album.clone(),
        genre: metadata.tags.genre.clone(),
        year: metadata.tags.year,
        comment: metadata.tags.comment.clone(),
        artwork_path: metadata.tags.artwork_path.clone(),
        music_style_id: music_style_id.clone(),
        music_style_label: music_style_label.clone(),
    };
    let track_file = TrackFileInfo {
        source_path: source_path.clone(),
        storage_path: storage_path.clone(),
        source_kind: "file".to_string(),
        file_extension: file_extension.clone(),
        size_bytes,
        modified_at,
        checksum: row_source_checksum,
        availability_state,
        playback_source,
    };
    let track_analysis = TrackAnalysisInfo {
        imported_at: imported_at.clone(),
        bpm: row
            .get(3)
            .map_err(|error| format!("Failed to read track BPM: {error}"))?,
        bpm_confidence: row
            .get(4)
            .map_err(|error| format!("Failed to read track confidence: {error}"))?,
        duration_seconds: row
            .get(8)
            .map_err(|error| format!("Failed to read duration: {error}"))?,
        waveform_bins: waveform_bins.clone(),
        beat_grid: beat_grid.clone(),
        bpm_curve: bpm_curve.clone(),
        analyzer_status: analyzer_status.clone(),
        analysis_mode: analysis_mode.clone(),
        analyzer_version: metadata.analysis.analyzer_version.clone(),
        analyzed_at: metadata
            .analysis
            .analyzed_at
            .clone()
            .or_else(|| Some(imported_at.clone())),
        repo_suggested_bpm,
        repo_suggested_status: repo_suggested_status.clone(),
        notes: notes.clone(),
        key_signature: key_signature.clone(),
        energy_level,
        danceability,
        structural_patterns: structural_patterns.clone(),
    };

    Ok(LibraryTrack {
        id: row
            .get(0)
            .map_err(|error| format!("Failed to read track id: {error}"))?,
        file: track_file,
        tags: track_tags,
        analysis: track_analysis,
        performance,
        title: track_title,
        source_path,
        storage_path,
        bpm: row
            .get(3)
            .map_err(|error| format!("Failed to read track BPM: {error}"))?,
        bpm_confidence: row
            .get(4)
            .map_err(|error| format!("Failed to read track confidence: {error}"))?,
        imported_at,
        duration_seconds: row
            .get(8)
            .map_err(|error| format!("Failed to read duration: {error}"))?,
        waveform_bins,
        beat_grid,
        bpm_curve,
        analyzer_status,
        repo_suggested_bpm,
        repo_suggested_status,
        notes,
        file_extension,
        analysis_mode,
        music_style_id,
        music_style_label,
        key_signature,
        energy_level,
        danceability,
        structural_patterns,
    })
}

fn read_tracks(conn: &Connection) -> Result<Vec<LibraryTrack>, String> {
    let mut statement = conn
        .prepare(
            "
            SELECT
                m.id,
                m.title,
                m.source_path,
                m.suggested_bpm,
                m.confidence,
                m.created_at,
                m.metadata_json,
                t.storage_path,
                t.duration_seconds,
                t.waveform_bins_json,
                t.beat_grid_json,
                t.bpm_curve_json,
                s.color,
                s.rating,
                s.play_count,
                s.last_played_at,
                s.bpm_lock,
                s.grid_lock,
                s.main_cue_second,
                s.hot_cues_json,
                s.memory_cues_json,
                s.saved_loops_json,
                s.missing_state,
                s.file_size_bytes,
                s.source_modified_at,
                s.source_checksum
            FROM musical_assets m
            INNER JOIN track_analyses t ON t.asset_id = m.id
            LEFT JOIN track_library_states s ON s.asset_id = m.id
            WHERE m.asset_type = 'track_analysis'
            ORDER BY m.created_at DESC
            ",
        )
        .map_err(|error| format!("Failed to prepare track query: {error}"))?;

    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query tracks: {error}"))?;
    let mut tracks = Vec::new();

    let mut skipped_rows = 0usize;

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate track rows: {error}"))?
    {
        match decode_track_row(row) {
            Ok(track) => tracks.push(track),
            Err(error) => {
                skipped_rows += 1;
                eprintln!("[MAIA:Rust] skipping track row: {error}");
            }
        }
    }

    if tracks.is_empty() && skipped_rows > 0 {
        return Err(format!(
            "Failed to decode all track rows. Skipped {skipped_rows} corrupted entries. Check the Tauri terminal for row-level details."
        ));
    }

    Ok(tracks)
}

fn read_playlists(conn: &Connection) -> Result<Vec<BaseTrackPlaylist>, String> {
    let mut playlist_statement = conn
        .prepare(
            "
            SELECT id, name, created_at, updated_at
            FROM base_track_playlists
            ORDER BY updated_at DESC, name COLLATE NOCASE ASC
            ",
        )
        .map_err(|error| format!("Failed to prepare base playlist query: {error}"))?;
    let mut item_statement = conn
        .prepare(
            "
            SELECT track_id
            FROM base_track_playlist_items
            WHERE playlist_id = ?1
            ORDER BY position ASC
            ",
        )
        .map_err(|error| format!("Failed to prepare base playlist items query: {error}"))?;

    let playlist_rows = playlist_statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|error| format!("Failed to query base playlists: {error}"))?;

    let mut playlists = Vec::new();

    for playlist_row in playlist_rows {
        let (id, name, created_at, updated_at) = playlist_row
            .map_err(|error| format!("Failed to decode base playlist row: {error}"))?;
        let item_rows = item_statement
            .query_map([id.clone()], |row| row.get::<_, String>(0))
            .map_err(|error| format!("Failed to query playlist items for {id}: {error}"))?;

        let mut track_ids = Vec::new();
        for item_row in item_rows {
            track_ids.push(
                item_row.map_err(|error| {
                    format!("Failed to decode playlist track for {id}: {error}")
                })?,
            );
        }

        playlists.push(BaseTrackPlaylist {
            id,
            name,
            track_ids,
            created_at,
            updated_at,
        });
    }

    Ok(playlists)
}

fn persist_playlist(
    conn: &Connection,
    input: SaveBaseTrackPlaylistInput,
) -> Result<BaseTrackPlaylist, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Playlist name is required.".to_string());
    }

    let mut track_ids = Vec::new();
    for track_id in input.track_ids {
        let trimmed = track_id.trim();
        if !trimmed.is_empty() && !track_ids.iter().any(|existing: &String| existing == trimmed) {
            track_ids.push(trimmed.to_string());
        }
    }

    if track_ids.is_empty() {
        return Err("Playlist must include at least one track.".to_string());
    }

    for track_id in &track_ids {
        let exists: i64 = conn
            .query_row(
                "
                SELECT COUNT(*)
                FROM musical_assets
                WHERE id = ?1 AND asset_type = 'track_analysis'
                ",
                [track_id],
                |row| row.get(0),
            )
            .map_err(|error| format!("Failed to validate playlist track {track_id}: {error}"))?;

        if exists == 0 {
            return Err(format!("Playlist track not found: {track_id}"));
        }
    }

    let now = now_iso();
    let playlist_id = input
        .id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| format!("playlist-{}", now_millis()));
    let created_at = conn
        .query_row(
            "SELECT created_at FROM base_track_playlists WHERE id = ?1",
            [playlist_id.clone()],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Failed to read existing playlist timestamp: {error}"))?
        .unwrap_or_else(|| now.clone());

    conn.execute(
        "
        INSERT INTO base_track_playlists (id, name, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          updated_at = excluded.updated_at
        ",
        params![playlist_id, name, created_at, now],
    )
    .map_err(|error| format!("Failed to persist playlist header: {error}"))?;

    conn.execute(
        "DELETE FROM base_track_playlist_items WHERE playlist_id = ?1",
        [playlist_id.clone()],
    )
    .map_err(|error| format!("Failed to reset playlist items: {error}"))?;

    for (index, track_id) in track_ids.iter().enumerate() {
        conn.execute(
            "
            INSERT INTO base_track_playlist_items (playlist_id, track_id, position)
            VALUES (?1, ?2, ?3)
            ",
            params![playlist_id, track_id, index as i64],
        )
        .map_err(|error| format!("Failed to persist playlist item {track_id}: {error}"))?;
    }

    read_playlists(conn)?
        .into_iter()
        .find(|playlist| playlist.id == playlist_id)
        .ok_or_else(|| "Failed to reload persisted playlist.".to_string())
}

fn delete_playlist_record(conn: &Connection, playlist_id: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE sessions SET playlist_id = NULL WHERE playlist_id = ?1",
        [playlist_id],
    )
    .map_err(|error| format!("Failed to clear sessions for playlist {playlist_id}: {error}"))?;

    conn.execute(
        "DELETE FROM base_track_playlists WHERE id = ?1",
        [playlist_id],
    )
    .map_err(|error| format!("Failed to delete playlist {playlist_id}: {error}"))?;

    Ok(())
}

fn persist_track_performance_update(
    conn: &Connection,
    track_id: &str,
    input: UpdateTrackPerformanceInput,
) -> Result<LibraryTrack, String> {
    let track = read_tracks(conn)?
        .into_iter()
        .find(|entry| entry.id == track_id)
        .ok_or_else(|| format!("Track not found: {track_id}"))?;
    let mut state = track_library_state_from_track(&track);

    if let Some(rating) = input.rating {
        if !(0..=5).contains(&rating) {
            return Err("Track rating must be between 0 and 5.".to_string());
        }
        state.rating = rating;
    }

    if let Some(color) = input.color {
        state.color = color.and_then(|value| {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        });
    }

    if let Some(bpm_lock) = input.bpm_lock {
        state.bpm_lock = bpm_lock;
    }

    if let Some(grid_lock) = input.grid_lock {
        state.grid_lock = grid_lock;
    }

    if let Some(main_cue_second) = input.main_cue_second {
        state.main_cue_second = main_cue_second;
    }

    if let Some(mut hot_cues) = input.hot_cues {
        hot_cues.sort_by(|left, right| {
            left.second
                .partial_cmp(&right.second)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        state.hot_cues = hot_cues;
    }

    if let Some(mut memory_cues) = input.memory_cues {
        memory_cues.sort_by(|left, right| {
            left.second
                .partial_cmp(&right.second)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        state.memory_cues = memory_cues;
    }

    if let Some(mut saved_loops) = input.saved_loops {
        saved_loops.sort_by(|left, right| {
            left.start_second
                .partial_cmp(&right.start_second)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        state.saved_loops = saved_loops;
    }

    if input.mark_played.unwrap_or(false) {
        state.play_count += 1;
        state.last_played_at = Some(now_iso());
    }

    let hot_cues_json = serde_json::to_string(&state.hot_cues)
        .map_err(|error| format!("Failed to encode hot cues JSON: {error}"))?;
    let memory_cues_json = serde_json::to_string(&state.memory_cues)
        .map_err(|error| format!("Failed to encode memory cues JSON: {error}"))?;
    let saved_loops_json = serde_json::to_string(&state.saved_loops)
        .map_err(|error| format!("Failed to encode saved loops JSON: {error}"))?;

    conn.execute(
        "
        INSERT INTO track_library_states (
            asset_id,
            color,
            rating,
            play_count,
            last_played_at,
            bpm_lock,
            grid_lock,
            main_cue_second,
            hot_cues_json,
            memory_cues_json,
            saved_loops_json,
            missing_state,
            file_size_bytes,
            source_modified_at,
            source_checksum
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
        ON CONFLICT(asset_id) DO UPDATE SET
            color = excluded.color,
            rating = excluded.rating,
            play_count = excluded.play_count,
            last_played_at = excluded.last_played_at,
            bpm_lock = excluded.bpm_lock,
            grid_lock = excluded.grid_lock,
            main_cue_second = excluded.main_cue_second,
            hot_cues_json = excluded.hot_cues_json,
            memory_cues_json = excluded.memory_cues_json,
            saved_loops_json = excluded.saved_loops_json,
            missing_state = excluded.missing_state,
            file_size_bytes = excluded.file_size_bytes,
            source_modified_at = excluded.source_modified_at,
            source_checksum = excluded.source_checksum
        ",
        params![
            track_id,
            state.color,
            state.rating,
            state.play_count,
            state.last_played_at,
            if state.bpm_lock { 1 } else { 0 },
            if state.grid_lock { 1 } else { 0 },
            state.main_cue_second,
            hot_cues_json,
            memory_cues_json,
            saved_loops_json,
            state.missing_state,
            state.file_size_bytes,
            state.source_modified_at,
            state.source_checksum
        ],
    )
    .map_err(|error| format!("Failed to update track performance state: {error}"))?;

    conn.execute(
        "UPDATE musical_assets SET updated_at = ?1 WHERE id = ?2",
        params![now_iso(), track_id],
    )
    .map_err(|error| format!("Failed to touch track updated_at: {error}"))?;

    read_tracks(conn)?
        .into_iter()
        .find(|entry| entry.id == track_id)
        .ok_or_else(|| format!("Track disappeared after update: {track_id}"))
}

fn persist_track_analysis_update(
    conn: &Connection,
    track_id: &str,
    input: UpdateTrackAnalysisInput,
) -> Result<LibraryTrack, String> {
    let track = read_tracks(conn)?
        .into_iter()
        .find(|entry| entry.id == track_id)
        .ok_or_else(|| format!("Track not found: {track_id}"))?;

    if track.performance.grid_lock {
        return Err("Unlock the track grid before editing beat markers.".to_string());
    }

    let next_bpm = input.bpm.or(track.analysis.bpm);
    if let Some(bpm) = next_bpm {
        if !(40.0..=240.0).contains(&bpm) {
            return Err("Track BPM must be between 40 and 240.".to_string());
        }
    }

    let next_beat_grid = normalize_beat_grid_points(
        input.beat_grid.unwrap_or_else(|| track.analysis.beat_grid.clone()),
        track.analysis.duration_seconds,
    );
    let next_bpm_curve = normalize_bpm_curve_points(
        input.bpm_curve.unwrap_or_else(|| track.analysis.bpm_curve.clone()),
        track.analysis.duration_seconds,
    );

    let mut metadata = track_metadata_from_track(&track);
    let now = now_iso();
    metadata.analysis.analyzed_at = Some(now.clone());
    if !metadata
        .analysis
        .notes
        .iter()
        .any(|note| note == "Beat grid manually adjusted in Maia desktop.")
    {
        metadata
            .analysis
            .notes
            .push("Beat grid manually adjusted in Maia desktop.".to_string());
    }
    metadata.notes = metadata.analysis.notes.clone();

    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|error| format!("Failed to encode track metadata JSON: {error}"))?;
    let beat_grid_json = serde_json::to_string(&next_beat_grid)
        .map_err(|error| format!("Failed to encode beat grid JSON: {error}"))?;
    let bpm_curve_json = serde_json::to_string(&next_bpm_curve)
        .map_err(|error| format!("Failed to encode BPM curve JSON: {error}"))?;

    conn.execute(
        "
        UPDATE musical_assets
        SET suggested_bpm = ?1,
            metadata_json = ?2,
            updated_at = ?3
        WHERE id = ?4
        ",
        params![next_bpm, metadata_json, now, track_id],
    )
    .map_err(|error| format!("Failed to update track asset metadata: {error}"))?;

    let updated_rows = conn
        .execute(
            "
            UPDATE track_analyses
            SET beat_grid_json = ?1,
                bpm_curve_json = ?2
            WHERE asset_id = ?3
            ",
            params![beat_grid_json, bpm_curve_json, track_id],
        )
        .map_err(|error| format!("Failed to update track beat grid: {error}"))?;

    if updated_rows == 0 {
        return Err(format!("Track analysis row missing for: {track_id}"));
    }

    read_tracks(conn)?
        .into_iter()
        .find(|entry| entry.id == track_id)
        .ok_or_else(|| format!("Track disappeared after analysis update: {track_id}"))
}

fn read_base_assets(conn: &Connection) -> Result<Vec<BaseAssetRecord>, String> {
    let mut statement = conn
        .prepare(
            "
            SELECT
                m.id,
                m.title,
                m.source_path,
                m.source_kind,
                m.confidence,
                m.created_at,
                m.metadata_json,
                b.storage_path,
                b.category,
                b.checksum,
                b.reusable
            FROM musical_assets m
            INNER JOIN base_assets b ON b.asset_id = m.id
            WHERE m.asset_type = 'base_asset'
            ORDER BY m.created_at DESC
            ",
        )
        .map_err(|error| format!("Failed to prepare base asset query: {error}"))?;

    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query base assets: {error}"))?;
    let mut base_assets = Vec::new();

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate base asset rows: {error}"))?
    {
        let metadata_json: String = row
            .get(6)
            .map_err(|error| format!("Failed to read base asset metadata: {error}"))?;
        let metadata: BaseAssetMetadata = serde_json::from_str(&metadata_json)
            .map_err(|error| format!("Failed to decode base asset metadata JSON: {error}"))?;
        let category_id = normalized_base_asset_category_id(&metadata);
        let category_label = normalized_base_asset_category_label(&metadata);
        let entry_count = metadata
            .metrics
            .get("entryCount")
            .and_then(Value::as_i64)
            .unwrap_or(0);

        base_assets.push(BaseAssetRecord {
            id: row
                .get(0)
                .map_err(|error| format!("Failed to read base asset id: {error}"))?,
            title: row
                .get(1)
                .map_err(|error| format!("Failed to read base asset title: {error}"))?,
            source_path: row
                .get(2)
                .map_err(|error| format!("Failed to read base asset source path: {error}"))?,
            source_kind: row
                .get(3)
                .map_err(|error| format!("Failed to read base asset source kind: {error}"))?,
            confidence: row
                .get(4)
                .map_err(|error| format!("Failed to read base asset confidence: {error}"))?,
            imported_at: row
                .get(5)
                .map_err(|error| format!("Failed to read base asset timestamp: {error}"))?,
            storage_path: row
                .get(7)
                .map_err(|error| format!("Failed to read base asset storage path: {error}"))?,
            category_id,
            category_label,
            checksum: row
                .get(9)
                .map_err(|error| format!("Failed to read base asset checksum: {error}"))?,
            reusable: row
                .get::<_, i64>(10)
                .map_err(|error| format!("Failed to read base asset reusable flag: {error}"))?
                != 0,
            entry_count,
            summary: metadata.summary,
            analyzer_status: metadata.analyzer_status,
            notes: metadata.notes,
            tags: metadata.tags,
            metrics: metadata.metrics,
        });
    }

    Ok(base_assets)
}

fn read_compositions(conn: &Connection) -> Result<Vec<CompositionResultRecord>, String> {
    let mut statement = conn
        .prepare(
            "
            SELECT
                m.id,
                m.title,
                m.source_path,
                m.source_kind,
                m.suggested_bpm,
                m.confidence,
                m.created_at,
                m.metadata_json,
                c.base_asset_id,
                c.reference_type,
                c.reference_asset_id,
                c.strategy,
                c.arrangement_summary,
                c.export_path,
                c.waveform_bins_json,
                c.beat_grid_json,
                c.bpm_curve_json
            FROM musical_assets m
            INNER JOIN composition_results c ON c.asset_id = m.id
            WHERE m.asset_type = 'composition_result'
            ORDER BY m.created_at DESC
            ",
        )
        .map_err(|error| format!("Failed to prepare composition query: {error}"))?;

    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query compositions: {error}"))?;
    let mut compositions = Vec::new();

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate composition rows: {error}"))?
    {
        let metadata_json: String = row
            .get(7)
            .map_err(|error| format!("Failed to read composition metadata: {error}"))?;
        let waveform_json: String = row
            .get(14)
            .map_err(|error| format!("Failed to read composition waveform JSON: {error}"))?;
        let beat_grid_json: String = row
            .get(15)
            .map_err(|error| format!("Failed to read composition beat grid JSON: {error}"))?;
        let bpm_curve_json: String = row
            .get(16)
            .map_err(|error| format!("Failed to read composition BPM curve JSON: {error}"))?;
        let metadata: CompositionMetadata = serde_json::from_str(&metadata_json)
            .map_err(|error| format!("Failed to decode composition metadata JSON: {error}"))?;
        let waveform_bins: Vec<f64> = serde_json::from_str(&waveform_json)
            .map_err(|error| format!("Failed to decode composition waveform JSON: {error}"))?;
        let beat_grid: Vec<BeatGridPoint> = serde_json::from_str(&beat_grid_json)
            .map_err(|error| format!("Failed to decode composition beat grid JSON: {error}"))?;
        let bpm_curve: Vec<BpmCurvePoint> = serde_json::from_str(&bpm_curve_json)
            .map_err(|error| format!("Failed to decode composition BPM curve JSON: {error}"))?;

        compositions.push(CompositionResultRecord {
            id: row
                .get(0)
                .map_err(|error| format!("Failed to read composition id: {error}"))?,
            title: row
                .get(1)
                .map_err(|error| format!("Failed to read composition title: {error}"))?,
            source_path: row
                .get(2)
                .map_err(|error| format!("Failed to read composition source path: {error}"))?,
            export_path: row
                .get(13)
                .map_err(|error| format!("Failed to read composition export path: {error}"))?,
            preview_audio_path: metric_string_opt(&metadata.metrics, "previewAudioPath"),
            source_kind: row
                .get(3)
                .map_err(|error| format!("Failed to read composition source kind: {error}"))?,
            target_bpm: row
                .get::<_, Option<f64>>(4)
                .map_err(|error| format!("Failed to read composition BPM: {error}"))?
                .unwrap_or(0.0),
            confidence: row
                .get(5)
                .map_err(|error| format!("Failed to read composition confidence: {error}"))?,
            imported_at: row
                .get(6)
                .map_err(|error| format!("Failed to read composition timestamp: {error}"))?,
            base_asset_id: row
                .get(8)
                .map_err(|error| format!("Failed to read composition base asset id: {error}"))?,
            base_asset_title: metadata.base_asset_title,
            base_asset_category_id: metadata.base_asset_category_id,
            base_asset_category_label: metadata.base_asset_category_label,
            base_playlist_id: metadata.base_playlist_id,
            base_playlist_name: metadata.base_playlist_name,
            reference_type: row
                .get(9)
                .map_err(|error| format!("Failed to read composition reference type: {error}"))?,
            reference_asset_id: row
                .get(10)
                .map_err(|error| format!("Failed to read composition reference id: {error}"))?,
            reference_title: metadata.reference_title,
            reference_source_path: metadata.reference_source_path,
            strategy: row
                .get(11)
                .map_err(|error| format!("Failed to read composition strategy: {error}"))?,
            summary: row
                .get(12)
                .map_err(|error| format!("Failed to read composition summary: {error}"))?,
            analyzer_status: metadata.analyzer_status,
            notes: metadata.notes,
            tags: metadata.tags,
            metrics: metadata.metrics,
            waveform_bins,
            beat_grid,
            bpm_curve,
        });
    }

    Ok(compositions)
}

fn read_repositories(conn: &Connection) -> Result<Vec<RepositoryAnalysis>, String> {
    let mut statement = conn
        .prepare(
            "
            SELECT
                m.id,
                m.title,
                m.source_path,
                m.suggested_bpm,
                m.confidence,
                m.created_at,
                m.metadata_json,
                r.storage_path,
                r.build_system,
                r.primary_language,
                r.java_file_count,
                r.test_file_count,
                r.heuristic_summary,
                r.metric_snapshot_json
            FROM musical_assets m
            INNER JOIN repo_analyses r ON r.asset_id = m.id
            WHERE m.asset_type = 'repo_analysis'
            ORDER BY m.created_at DESC
            ",
        )
        .map_err(|error| format!("Failed to prepare repository query: {error}"))?;

    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query repositories: {error}"))?;
    let mut repositories = Vec::new();

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate repository rows: {error}"))?
    {
        let metadata_json: String = row
            .get(6)
            .map_err(|error| format!("Failed to read repository metadata: {error}"))?;
        let metrics_json: String = row
            .get(13)
            .map_err(|error| format!("Failed to read repository metrics: {error}"))?;
        let metadata: RepositoryMetadata = serde_json::from_str(&metadata_json)
            .map_err(|error| format!("Failed to decode repository metadata JSON: {error}"))?;
        let metrics: Value = serde_json::from_str(&metrics_json)
            .map_err(|error| format!("Failed to decode repository metrics JSON: {error}"))?;

        repositories.push(RepositoryAnalysis {
            id: row
                .get(0)
                .map_err(|error| format!("Failed to read repository id: {error}"))?,
            title: row
                .get(1)
                .map_err(|error| format!("Failed to read repository title: {error}"))?,
            source_path: row
                .get(2)
                .map_err(|error| format!("Failed to read repository source path: {error}"))?,
            storage_path: row
                .get(7)
                .map_err(|error| format!("Failed to read repository storage path: {error}"))?,
            suggested_bpm: row
                .get(3)
                .map_err(|error| format!("Failed to read repository BPM: {error}"))?,
            confidence: row
                .get(4)
                .map_err(|error| format!("Failed to read repository confidence: {error}"))?,
            imported_at: row
                .get(5)
                .map_err(|error| format!("Failed to read repository timestamp: {error}"))?,
            source_kind: metadata.source_kind,
            summary: row
                .get(12)
                .map_err(|error| format!("Failed to read repository summary: {error}"))?,
            analyzer_status: metadata.analyzer_status,
            build_system: row
                .get::<_, Option<String>>(8)
                .map_err(|error| format!("Failed to read build system: {error}"))?
                .unwrap_or_else(|| "unknown".to_string()),
            primary_language: row
                .get::<_, Option<String>>(9)
                .map_err(|error| format!("Failed to read primary language: {error}"))?
                .unwrap_or_else(|| "unknown".to_string()),
            java_file_count: row
                .get(10)
                .map_err(|error| format!("Failed to read Java file count: {error}"))?,
            test_file_count: row
                .get(11)
                .map_err(|error| format!("Failed to read test file count: {error}"))?,
            notes: metadata.notes,
            tags: metadata.tags,
            metrics,
        });
    }

    Ok(repositories)
}

fn insert_track(
    conn: &Connection,
    input: ImportTrackInput,
    music_style_catalog: &MusicStyleCatalog,
    managed_root: &Path,
) -> Result<LibraryTrack, String> {
    let title = input.title.trim();
    let raw_source_path = input.source_path.trim();
    // Canonicalize once — used for dedup check AND stored in the DB so
    // future imports of the same file (via symlink, `~/…`, or absolute path)
    // all resolve to the same key.
    let source_path_owned = canonical_source_path(raw_source_path);
    let source_path = source_path_owned.as_str();
    let music_style_id = input.music_style_id.trim();

    // Prevent duplicates by canonical path
    if check_duplicate_source_path(conn, source_path)? {
        return Err(format!("A track with path '{}' already exists in your library.", source_path));
    }

    if title.is_empty() {
        return Err("Track title is required.".to_string());
    }

    if source_path.is_empty() {
        return Err("Track source path is required.".to_string());
    }

    if music_style_id.is_empty() {
        return Err("Track music style is required.".to_string());
    }

    let music_style = music_style_catalog
        .music_styles
        .iter()
        .find(|style| style.id == music_style_id)
        .ok_or_else(|| format!("Unknown track music style: {music_style_id}"))?;

    let now = now_millis().to_string();
    let id = format!(
        "trk-{}-{:x}",
        now,
        stable_hash(&format!("{title}:{source_path}:{music_style_id}:{now}"))
    );
    let managed_snapshot = copy_track_to_managed_storage(source_path, managed_root, &id)?;
    let analysis = analyze_track_import(
        title,
        source_path,
        managed_snapshot
            .as_ref()
            .map(|(_, managed_path)| managed_path.to_string_lossy().to_string())
            .as_deref(),
        music_style,
    )?;
    let metadata_json = serde_json::to_string(&analysis.metadata)
        .map_err(|error| format!("Failed to encode track metadata: {error}"))?;
    let waveform_json = serde_json::to_string(&analysis.waveform_bins)
        .map_err(|error| format!("Failed to encode waveform bins: {error}"))?;
    let analyzer_tag = if analysis.metadata.analysis_mode == "embedded-heuristic" {
        "python-analyzer-heuristic"
    } else if analysis.metadata.analysis_mode == "hash-stub" {
        "python-analyzer-hash-stub"
    } else {
        "mock-analyzer"
    };
    let tags_json = serde_json::json!([
        "track-analysis",
        "imported",
        analyzer_tag,
        analysis.metadata.file_extension.clone(),
        format!("music-style:{}", music_style.id)
    ])
    .to_string();

    conn.execute(
        "
        INSERT INTO musical_assets (
            id,
            asset_type,
            title,
            source_path,
            source_kind,
            suggested_bpm,
            confidence,
            tags_json,
            metadata_json,
            created_at,
            updated_at
        ) VALUES (?1, 'track_analysis', ?2, ?3, 'file', ?4, ?5, ?6, ?7, ?8, ?8)
        ",
        params![
            &id,
            &analysis.title,
            &analysis.source_path,
            analysis.bpm,
            analysis.confidence,
            tags_json,
            metadata_json,
            now
        ],
    )
    .map_err(|error| format!("Failed to insert track asset: {error}"))?;

    conn.execute(
        "
        INSERT INTO track_analyses (
            asset_id,
            storage_path,
            duration_seconds,
            sample_rate_hz,
            channels,
            waveform_bins_json,
            beat_grid_json,
            bpm_curve_json,
            analyzer_notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ",
        params![
            &id,
            &analysis.storage_path,
            analysis.duration_seconds,
            analysis.sample_rate_hz,
            analysis.channels,
            waveform_json,
            analysis.beat_grid_json,
            analysis.bpm_curve_json,
            analysis.analyzer_notes
        ],
    )
    .map_err(|error| format!("Failed to insert track analysis: {error}"))?;

    let structural_patterns = resolved_structural_patterns(&analysis.metadata);
    let notes = resolved_track_notes(&analysis.metadata);
    let file_extension = normalized_file_extension(&analysis.metadata);
    let analyzer_status = normalized_analyzer_status(&analysis.metadata);
    let analysis_mode = normalized_analysis_mode(&analysis.metadata);
    let music_style_id = normalized_music_style_id(&analysis.metadata);
    let music_style_label = normalized_music_style_label(&analysis.metadata);
    let key_signature = resolved_track_key_signature(&analysis.metadata);
    let energy_level = resolved_track_energy_level(&analysis.metadata);
    let danceability = resolved_track_danceability(&analysis.metadata);
    let repo_suggested_bpm = analysis
        .metadata
        .analysis
        .repo_suggested_bpm
        .or(analysis.metadata.repo_suggested_bpm);
    let repo_suggested_status = normalized_repo_suggested_status(&analysis.metadata);
    let (size_bytes, modified_at, missing_state, playback_source) = probe_track_file_state(
        &analysis.source_path,
        analysis.storage_path.as_deref(),
        analysis.metadata.file.size_bytes,
        analysis.metadata.file.modified_at.clone(),
    );
    let performance_state = default_track_library_state(
        &analysis.beat_grid,
        &structural_patterns,
        size_bytes,
        modified_at.clone(),
        missing_state.clone(),
    );
    let hot_cues_json = serde_json::to_string(&performance_state.hot_cues)
        .map_err(|error| format!("Failed to encode track hot cues: {error}"))?;
    let memory_cues_json = serde_json::to_string(&performance_state.memory_cues)
        .map_err(|error| format!("Failed to encode track memory cues: {error}"))?;
    let saved_loops_json = serde_json::to_string(&performance_state.saved_loops)
        .map_err(|error| format!("Failed to encode track saved loops: {error}"))?;

    conn.execute(
        "
        INSERT INTO track_library_states (
            asset_id,
            color,
            rating,
            play_count,
            last_played_at,
            bpm_lock,
            grid_lock,
            main_cue_second,
            hot_cues_json,
            memory_cues_json,
            saved_loops_json,
            missing_state,
            file_size_bytes,
            source_modified_at,
            source_checksum
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
        ",
        params![
            &id,
            &performance_state.color,
            performance_state.rating,
            performance_state.play_count,
            &performance_state.last_played_at,
            if performance_state.bpm_lock { 1 } else { 0 },
            if performance_state.grid_lock { 1 } else { 0 },
            performance_state.main_cue_second,
            hot_cues_json,
            memory_cues_json,
            saved_loops_json,
            &performance_state.missing_state,
            performance_state.file_size_bytes,
            &performance_state.source_modified_at,
            &performance_state.source_checksum
        ],
    )
    .map_err(|error| format!("Failed to insert track library state: {error}"))?;

    let file = TrackFileInfo {
        source_path: analysis.source_path.clone(),
        storage_path: analysis.storage_path.clone(),
        source_kind: "file".to_string(),
        file_extension: file_extension.clone(),
        size_bytes,
        modified_at,
        checksum: None,
        availability_state: missing_state,
        playback_source,
    };
    let tags = TrackTagsInfo {
        title: analysis.title.clone(),
        artist: analysis.metadata.tags.artist.clone(),
        album: analysis.metadata.tags.album.clone(),
        genre: analysis.metadata.tags.genre.clone(),
        year: analysis.metadata.tags.year,
        comment: analysis.metadata.tags.comment.clone(),
        artwork_path: analysis.metadata.tags.artwork_path.clone(),
        music_style_id: music_style_id.clone(),
        music_style_label: music_style_label.clone(),
    };
    let analysis_info = TrackAnalysisInfo {
        imported_at: now.clone(),
        bpm: Some(analysis.bpm),
        bpm_confidence: analysis.confidence,
        duration_seconds: analysis.duration_seconds,
        waveform_bins: analysis.waveform_bins.clone(),
        beat_grid: analysis.beat_grid.clone(),
        bpm_curve: analysis.bpm_curve.clone(),
        analyzer_status: analyzer_status.clone(),
        analysis_mode: analysis_mode.clone(),
        analyzer_version: analysis.metadata.analysis.analyzer_version.clone(),
        analyzed_at: analysis
            .metadata
            .analysis
            .analyzed_at
            .clone()
            .or_else(|| Some(now.clone())),
        repo_suggested_bpm,
        repo_suggested_status: repo_suggested_status.clone(),
        notes: notes.clone(),
        key_signature: key_signature.clone(),
        energy_level,
        danceability,
        structural_patterns: structural_patterns.clone(),
    };
    let performance = TrackPerformanceInfo {
        color: performance_state.color.clone(),
        rating: performance_state.rating,
        play_count: performance_state.play_count,
        last_played_at: performance_state.last_played_at.clone(),
        bpm_lock: performance_state.bpm_lock,
        grid_lock: performance_state.grid_lock,
        main_cue_second: performance_state.main_cue_second,
        hot_cues: performance_state.hot_cues.clone(),
        memory_cues: performance_state.memory_cues.clone(),
        saved_loops: performance_state.saved_loops.clone(),
    };

    Ok(LibraryTrack {
        id,
        file,
        tags,
        analysis: analysis_info,
        performance,
        title: analysis.title,
        source_path: analysis.source_path,
        storage_path: analysis.storage_path,
        imported_at: now,
        bpm: Some(analysis.bpm),
        bpm_confidence: analysis.confidence,
        duration_seconds: analysis.duration_seconds,
        waveform_bins: analysis.waveform_bins,
        beat_grid: analysis.beat_grid,
        bpm_curve: analysis.bpm_curve,
        analyzer_status,
        repo_suggested_bpm,
        repo_suggested_status,
        notes,
        file_extension,
        analysis_mode,
        music_style_id,
        music_style_label,
        key_signature,
        energy_level,
        danceability,
        structural_patterns,
    })
}

fn insert_base_asset(
    conn: &Connection,
    input: ImportBaseAssetInput,
    category_catalog: &BaseAssetCategoryCatalog,
    managed_root: &Path,
) -> Result<BaseAssetRecord, String> {
    let source_kind = input.source_kind.trim();
    let source_path = input.source_path.trim();
    let category_id = input.category_id.trim();

    if check_duplicate_source_path(conn, source_path)? {
        return Err(format!("A base asset with path '{}' already exists in your library.", source_path));
    }
    let label = input
        .label
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    if !matches!(source_kind, "file" | "directory") {
        return Err("Base asset source kind must be 'file' or 'directory'.".to_string());
    }

    if source_path.is_empty() {
        return Err("Base asset path is required.".to_string());
    }

    if category_id.is_empty() {
        return Err("Base asset category is required.".to_string());
    }

    let category = category_catalog
        .base_asset_categories
        .iter()
        .find(|entry| entry.id == category_id)
        .ok_or_else(|| format!("Unknown base asset category: {category_id}"))?;

    let now = now_millis().to_string();
    let id = format!(
        "bas-{}-{:x}",
        now,
        stable_hash(&format!(
            "{}:{}:{}:{}:{}",
            source_kind, source_path, category.id, input.reusable, now
        ))
    );
    let (resolved_source_path, managed_storage_path) =
        copy_base_asset_to_managed_storage(source_kind, source_path, managed_root, &id)?;
    let analysis = analyze_base_asset_import(
        source_kind,
        &resolved_source_path.display().to_string(),
        &managed_storage_path.display().to_string(),
        label.as_deref(),
        category,
        input.reusable,
    )?;
    let metadata_json = serde_json::to_string(&analysis.metadata)
        .map_err(|error| format!("Failed to encode base asset metadata: {error}"))?;
    let tags_json = serde_json::to_string(&analysis.metadata.tags)
        .map_err(|error| format!("Failed to encode base asset tags: {error}"))?;

    conn.execute(
        "
        INSERT INTO musical_assets (
            id,
            asset_type,
            title,
            source_path,
            source_kind,
            suggested_bpm,
            confidence,
            tags_json,
            metadata_json,
            created_at,
            updated_at
        ) VALUES (?1, 'base_asset', ?2, ?3, ?4, NULL, ?5, ?6, ?7, ?8, ?8)
        ",
        params![
            &id,
            &analysis.title,
            &analysis.source_path,
            &analysis.source_kind,
            analysis.confidence,
            tags_json,
            metadata_json,
            now
        ],
    )
    .map_err(|error| format!("Failed to insert base asset: {error}"))?;

    conn.execute(
        "
        INSERT INTO base_assets (
            asset_id,
            storage_path,
            category,
            checksum,
            reusable
        ) VALUES (?1, ?2, ?3, ?4, ?5)
        ",
        params![
            &id,
            &analysis.storage_path,
            &analysis.category_id,
            analysis.checksum,
            if analysis.reusable { 1 } else { 0 }
        ],
    )
    .map_err(|error| format!("Failed to insert base asset details: {error}"))?;

    Ok(BaseAssetRecord {
        id,
        title: analysis.title,
        source_path: analysis.source_path,
        storage_path: analysis.storage_path,
        source_kind: analysis.source_kind,
        imported_at: now,
        category_id: analysis.category_id,
        category_label: analysis.category_label,
        reusable: analysis.reusable,
        entry_count: analysis.entry_count,
        checksum: analysis.checksum,
        confidence: analysis.confidence,
        summary: analysis.summary,
        analyzer_status: analysis.metadata.analyzer_status,
        notes: analysis.metadata.notes,
        tags: analysis.metadata.tags,
        metrics: analysis.metrics,
    })
}

fn insert_composition(
    conn: &Connection,
    input: ImportCompositionInput,
    managed_root: &Path,
) -> Result<CompositionResultRecord, String> {
    let base_asset_id = input.base_asset_id.trim();
    let reference_type = input.reference_type.trim();
    let label = input
        .label
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    if base_asset_id.is_empty() {
        return Err("A base asset must be selected before composing.".to_string());
    }

    if !matches!(reference_type, "track" | "playlist" | "repo" | "manual") {
        return Err(
            "Composition reference type must be 'track', 'playlist', 'repo', or 'manual'."
                .to_string(),
        );
    }

    let base_asset = read_base_assets(conn)?
        .into_iter()
        .find(|entry| entry.id == base_asset_id)
        .ok_or_else(|| format!("Base asset not found: {base_asset_id}"))?;
    let reference = resolve_composition_reference(conn, &input)?;
    let now = now_millis().to_string();
    let id = format!(
        "cmp-{}-{:x}",
        now,
        stable_hash(&format!(
            "{}:{}:{}:{}",
            base_asset.id, reference.reference_type, reference.reference_title, now
        ))
    );
    let preview_audio_output_path = managed_root
        .join(&id)
        .join("preview.wav")
        .display()
        .to_string();
    let analysis = analyze_composition_import(
        &base_asset,
        &reference,
        label.as_deref(),
        Some(preview_audio_output_path.as_str()),
    )?;
    let mut record = CompositionResultRecord {
        id: id.clone(),
        title: analysis.title,
        source_path: analysis.source_path,
        export_path: None,
        preview_audio_path: analysis.preview_audio_path.clone(),
        source_kind: analysis.source_kind,
        imported_at: now.clone(),
        base_asset_id: analysis.base_asset_id,
        base_asset_title: analysis.base_asset_title,
        base_asset_category_id: analysis.base_asset_category_id,
        base_asset_category_label: analysis.base_asset_category_label,
        base_playlist_id: reference.base_playlist_id.clone(),
        base_playlist_name: reference.base_playlist_name.clone(),
        reference_type: analysis.reference_type,
        reference_asset_id: analysis.reference_asset_id,
        reference_title: analysis.reference_title,
        reference_source_path: analysis.reference_source_path,
        target_bpm: analysis.target_bpm,
        confidence: analysis.confidence,
        strategy: analysis.strategy,
        summary: analysis.summary,
        analyzer_status: analysis.metadata.analyzer_status.clone(),
        notes: analysis.metadata.notes.clone(),
        tags: analysis.metadata.tags.clone(),
        metrics: analysis.metrics,
        waveform_bins: analysis.waveform_bins,
        beat_grid: analysis.beat_grid,
        bpm_curve: analysis.bpm_curve,
    };
    if let Some(preview_audio_path) = record.preview_audio_path.clone() {
        apply_composition_preview_audio_metadata(&mut record, &preview_audio_path);
    }
    let export_path = write_composition_snapshot(&record, managed_root)?;
    apply_composition_export_metadata(&mut record, export_path);
    let metadata_json = serde_json::to_string(&composition_metadata_from_record(&record))
        .map_err(|error| format!("Failed to encode composition metadata: {error}"))?;
    let tags_json = serde_json::to_string(&record.tags)
        .map_err(|error| format!("Failed to encode composition tags: {error}"))?;

    conn.execute(
        "
        INSERT INTO musical_assets (
            id,
            asset_type,
            title,
            source_path,
            source_kind,
            suggested_bpm,
            confidence,
            tags_json,
            metadata_json,
            created_at,
            updated_at
        ) VALUES (?1, 'composition_result', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
        ",
        params![
            &id,
            &record.title,
            &record.source_path,
            &record.source_kind,
            record.target_bpm,
            record.confidence,
            tags_json,
            metadata_json,
            &now
        ],
    )
    .map_err(|error| format!("Failed to insert composition asset: {error}"))?;

    conn.execute(
        "
        INSERT INTO composition_results (
            asset_id,
            base_asset_id,
            reference_type,
            reference_asset_id,
            target_bpm,
            strategy,
            arrangement_summary,
            export_path,
            waveform_bins_json,
            beat_grid_json,
            bpm_curve_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        ",
        params![
            &id,
            &record.base_asset_id,
            &record.reference_type,
            &record.reference_asset_id,
            record.target_bpm,
            &record.strategy,
            &record.summary,
            &record.export_path,
            &analysis.waveform_bins_json,
            &analysis.beat_grid_json,
            &analysis.bpm_curve_json
        ],
    )
    .map_err(|error| format!("Failed to insert composition details: {error}"))?;

    Ok(record)
}

fn resolve_composition_reference(
    conn: &Connection,
    input: &ImportCompositionInput,
) -> Result<CompositionReferenceDraft, String> {
    let tracks = read_tracks(conn)?;
    let base_playlist = input
        .playlist_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|playlist_id| {
            read_playlists(conn)?
                .into_iter()
                .find(|entry| entry.id == playlist_id)
                .ok_or_else(|| format!("Playlist not found: {playlist_id}"))
        })
        .transpose()?;

    let base_track = input
        .track_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|track_id| {
            tracks
                .iter()
                .find(|entry| entry.id == track_id)
                .cloned()
                .ok_or_else(|| format!("Track not found: {track_id}"))
        })
        .transpose()?;

    if base_track.is_none() && base_playlist.is_none() {
        return Err("Composition requires a base track or a base playlist.".to_string());
    }

    let (base_bpm, base_reference_title, base_reference_source_path, base_reference_asset_id, base_reference_type, base_playlist_id, base_playlist_name) =
        if let Some(playlist) = base_playlist {
            let mut playlist_bpms = playlist
                .track_ids
                .iter()
                .filter_map(|track_id| {
                    tracks
                        .iter()
                        .find(|entry| entry.id == *track_id)
                        .and_then(|entry| entry.bpm)
                })
                .collect::<Vec<_>>();

            if playlist_bpms.is_empty() {
                return Err("The selected playlist does not contain any tracks with stored BPM yet.".to_string());
            }

            playlist_bpms.sort_by(|left, right| left.partial_cmp(right).unwrap_or(Ordering::Equal));
            let midpoint = playlist_bpms.len() / 2;
            let median_bpm = if playlist_bpms.len() % 2 == 0 {
                (playlist_bpms[midpoint - 1] + playlist_bpms[midpoint]) / 2.0
            } else {
                playlist_bpms[midpoint]
            };

            (
                median_bpm,
                playlist.name.clone(),
                None,
                Some(playlist.id.clone()),
                "playlist".to_string(),
                Some(playlist.id),
                Some(playlist.name),
            )
        } else if let Some(track) = base_track {
            let bpm = track
                .bpm
                .ok_or_else(|| "The selected track does not have a stored BPM yet.".to_string())?;

            (
                bpm,
                track.title.clone(),
                Some(track.source_path.clone()),
                Some(track.id.clone()),
                "track".to_string(),
                None,
                None,
            )
        } else {
            return Err("Composition requires a base track or a base playlist.".to_string());
        };

    if let Some(structure_id) = input
        .structure_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let repository = read_repositories(conn)?
            .into_iter()
            .find(|entry| entry.id == structure_id)
            .ok_or_else(|| format!("Repository reference not found: {structure_id}"))?;

        return Ok(CompositionReferenceDraft {
            base_playlist_id,
            base_playlist_name,
            reference_type: "repo".to_string(),
            reference_asset_id: Some(repository.id),
            reference_title: format!("{} (structured by {})", base_reference_title, repository.title),
            reference_source_path: Some(repository.source_path),
            target_bpm: repository.suggested_bpm.unwrap_or(base_bpm),
        });
    }

    Ok(CompositionReferenceDraft {
        base_playlist_id,
        base_playlist_name,
        reference_type: base_reference_type,
        reference_asset_id: base_reference_asset_id,
        reference_title: base_reference_title,
        reference_source_path: base_reference_source_path,
        target_bpm: base_bpm,
    })
}

fn insert_repository(
    conn: &Connection,
    input: ImportRepositoryInput,
    managed_root: &Path,
) -> Result<RepositoryAnalysis, String> {
    let source_kind = input.source_kind.trim();
    let source_path = input.source_path.trim();

    // Update mode (v5.5): If repository already exists, remove it first to allow "refresh"
    let canonical = canonical_source_path(source_path);
    if let Err(e) = conn.execute(
        "DELETE FROM musical_assets WHERE source_path = ?1",
        params![canonical],
    ) {
        eprintln!("[MAIA:Rust] Warning: Failed to clear existing repository record: {}", e);
    }
    let import_label = input
        .label
        .as_deref()
        .map(str::trim)
        .filter(|label| !label.is_empty())
        .map(str::to_string);

    if !matches!(source_kind, "directory" | "file" | "url") {
        return Err("Repository source kind must be 'directory', 'file', or 'url'.".to_string());
    }

    if source_path.is_empty() {
        return Err("Repository path or URL is required.".to_string());
    }

    let now = now_millis().to_string();
    let id = format!(
        "repo-{}-{:x}",
        now,
        stable_hash(&format!("{source_kind}:{source_path}:{now}"))
    );
    let managed_snapshot = if matches!(source_kind, "directory" | "file") {
        copy_repository_source_to_managed_storage(source_kind, source_path, managed_root, &id)?
    } else {
        None
    };
    let mut source = serde_json::Map::new();
    source.insert("kind".to_string(), Value::String(source_kind.to_string()));
    source.insert(
        "path".to_string(),
        Value::String(
            managed_snapshot
                .as_ref()
                .map(|(_, managed_path)| managed_path.to_string_lossy().to_string())
                .unwrap_or_else(|| source_path.to_string()),
        ),
    );
    if let Some(label) = import_label.clone() {
        source.insert("label".to_string(), Value::String(label));
    }

    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("repo-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "repo_analysis",
            "source": source,
            "options": {
                "inferCodeSuggestedBpm": true
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode analyzer repository response: {error}"))?;

    if parsed.status == "error" {
        let message = parsed
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| "Analyzer returned an unknown repository error.".to_string());
        return Err(message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a repository payload.".to_string())?;
    let build_system = metric_string(&payload.musical_asset.metrics, "buildSystem");
    let primary_language = metric_string(&payload.musical_asset.metrics, "primaryLanguage");
    let java_file_count = metric_i64(&payload.musical_asset.metrics, "javaFileCount");
    let test_file_count = metric_i64(&payload.musical_asset.metrics, "testFileCount");
    let analyzer_status = match source_kind {
        "url" => "Remote repository reference analyzed".to_string(),
        "file" => "Log file analyzed".to_string(),
        _ => "Filesystem repository analyzed".to_string(),
    };
    let metadata = RepositoryMetadata {
        source_kind: source_kind.to_string(),
        analyzer_status: analyzer_status.clone(),
        notes: {
            let mut notes = parsed.warnings.clone();
            if let Some((_, managed_path)) = &managed_snapshot {
                notes.push(if source_kind == "file" {
                    format!(
                        "Maia imported and analyzed a managed local log snapshot at {}.",
                        managed_path.display()
                    )
                } else {
                    format!(
                        "Maia imported and analyzed a managed local repository snapshot at {}.",
                        managed_path.display()
                    )
                });
            }
            notes
        },
        tags: payload.musical_asset.tags.clone(),
        import_label: import_label.clone(),
    };
    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|error| format!("Failed to encode repository metadata: {error}"))?;
    let asset_title = payload.musical_asset.title.clone();
    let suggested_bpm = payload.musical_asset.suggested_bpm;
    let confidence = payload.musical_asset.confidence;
    let tags = payload.musical_asset.tags.clone();
    let mut metrics = payload.musical_asset.metrics.clone();
    if let Value::Object(record) = &mut metrics {
        if source_kind != "url" {
            record.insert(
                "originalSourcePath".to_string(),
                Value::String(source_path.to_string()),
            );
            record.insert(
                "storagePath".to_string(),
                Value::String(
                    managed_snapshot
                        .as_ref()
                        .map(|(_, managed_path)| managed_path.to_string_lossy().to_string())
                        .unwrap_or_else(|| source_path.to_string()),
                ),
            );
            record.insert(
                "storageMode".to_string(),
                Value::String("managed-copy".to_string()),
            );
        } else {
            record.insert(
                "storageMode".to_string(),
                Value::String("remote-url".to_string()),
            );
        }
    }
    let metrics_json = metrics.to_string();
    let tags_json = serde_json::to_string(&tags)
        .map_err(|error| format!("Failed to encode repository tags: {error}"))?;

    conn.execute(
        "
        INSERT INTO musical_assets (
            id,
            asset_type,
            title,
            source_path,
            source_kind,
            suggested_bpm,
            confidence,
            tags_json,
            metadata_json,
            created_at,
            updated_at
        ) VALUES (?1, 'repo_analysis', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
        ",
        params![
            &id,
            &asset_title,
            source_path,
            source_kind,
            suggested_bpm,
            confidence,
            tags_json,
            metadata_json,
            &now
        ],
    )
    .map_err(|error| format!("Failed to insert repository asset: {error}"))?;

    conn.execute(
        "
        INSERT INTO repo_analyses (
            asset_id,
            repo_path,
            storage_path,
            build_system,
            primary_language,
            java_file_count,
            test_file_count,
            heuristic_summary,
            metric_snapshot_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ",
        params![
            &id,
            source_path,
            managed_snapshot
                .as_ref()
                .map(|(_, managed_path)| managed_path.to_string_lossy().to_string()),
            &build_system,
            &primary_language,
            java_file_count,
            test_file_count,
            &payload.summary,
            metrics_json
        ],
    )
    .map_err(|error| format!("Failed to insert repository analysis: {error}"))?;

    Ok(RepositoryAnalysis {
        id,
        title: asset_title,
        source_path: source_path.to_string(),
        storage_path: managed_snapshot
            .as_ref()
            .map(|(_, managed_path)| managed_path.to_string_lossy().to_string()),
        source_kind: source_kind.to_string(),
        imported_at: now,
        suggested_bpm,
        confidence,
        summary: payload.summary,
        analyzer_status: metadata.analyzer_status,
        build_system,
        primary_language,
        java_file_count,
        test_file_count,
        notes: metadata.notes.clone(),
        tags,
        metrics,
    })
}

fn analyze_track_import(
    title: &str,
    source_path: &str,
    storage_path: Option<&str>,
    music_style: &MusicStyleOption,
) -> Result<TrackImportAnalysis, String> {
    let fallback = build_mock_track(title, source_path, storage_path, music_style);
    let analyzer_source_path = storage_path.unwrap_or(source_path);
    let now = now_millis().to_string();
    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("track-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "track_analysis",
            "source": {
                "kind": "file",
                "path": analyzer_source_path
            },
            "options": {
                "waveformBins": 256
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode analyzer track response: {error}"))?;

    if parsed.status == "error" {
        let error = parsed
            .error
            .ok_or_else(|| "Analyzer returned an unknown track error.".to_string())?;

        if matches!(error.code.as_str(), "missing_source" | "invalid_source") {
            return Ok(fallback);
        }

        return Err(error.message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a track payload.".to_string())?;
    let analysis_mode = metric_string(&payload.musical_asset.metrics, "analysisMode");
    let waveform_bins = if payload.musical_asset.artifacts.waveform_bins.is_empty() {
        fallback.waveform_bins.clone()
    } else {
        payload.musical_asset.artifacts.waveform_bins.clone()
    };
    let beat_grid = if payload.musical_asset.artifacts.beat_grid.is_empty() {
        fallback.beat_grid.clone()
    } else {
        payload.musical_asset.artifacts.beat_grid.clone()
    };
    let bpm_curve = if payload.musical_asset.artifacts.bpm_curve.is_empty() {
        fallback.bpm_curve.clone()
    } else {
        payload.musical_asset.artifacts.bpm_curve.clone()
    };
    let file_extension = Path::new(source_path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| format!(".{}", value.to_lowercase()))
        .unwrap_or_else(|| fallback.metadata.file_extension.clone());
    let detected_bpm = payload.musical_asset.suggested_bpm.unwrap_or(fallback.bpm);
    let detected_confidence = if payload.musical_asset.suggested_bpm.is_some() {
        payload.musical_asset.confidence
    } else {
        fallback.confidence.min(0.44)
    };
    let duration_seconds =
        metric_f64(&payload.musical_asset.metrics, "durationSeconds").or(fallback.duration_seconds);
    let sample_rate_hz = metric_i64_opt(&payload.musical_asset.metrics, "sampleRateHz");
    let channels = metric_i64_opt(&payload.musical_asset.metrics, "channels");
    let key_signature = metric_string_opt(&payload.musical_asset.metrics, "keySignature");
    let energy_level = metric_f64(&payload.musical_asset.metrics, "energyLevel");
    let danceability = metric_f64(&payload.musical_asset.metrics, "danceability");
    let structural_patterns: Vec<TrackStructuralPattern> =
        decode_json_metric(&payload.musical_asset.metrics, "structuralPatterns")?;
    let beat_grid_json = serde_json::to_string(&beat_grid)
        .map_err(|error| format!("Failed to encode beat grid: {error}"))?;
    let bpm_curve_json = serde_json::to_string(&bpm_curve)
        .map_err(|error| format!("Failed to encode BPM curve: {error}"))?;
    let analyzer_status = match analysis_mode.as_str() {
        "embedded-heuristic" => "Embedded waveform + BPM heuristic".to_string(),
        "hash-stub" => "Hash waveform stub + style BPM prior".to_string(),
        _ => "Track analysis imported".to_string(),
    };
    let analyzed_at = now_iso();
    let mut notes = vec![format!(
        "Imported with {} prior ({}-{} BPM).",
        music_style.label, music_style.min_bpm, music_style.max_bpm
    )];
    if payload.musical_asset.suggested_bpm.is_some() {
        notes.push(
            "Detected BPM came from embedded audio heuristics inside the analyzer.".to_string(),
        );
    } else {
        notes.push("Detected BPM still uses the selected style prior because tempo heuristics were unavailable for this file.".to_string());
    }
    if let Some(storage_path) = storage_path {
        notes.push(format!(
            "Maia imported and analyzed a managed local snapshot at {}.",
            storage_path
        ));
    } else {
        notes.push("This track is currently using the original unresolved path or demo path because no managed snapshot was created.".to_string());
    }
    notes.push("Waveform, beat grid, and BPM curve are available in the analyzer screen as persisted local artifacts.".to_string());
    notes.extend(parsed.warnings.clone());

    Ok(TrackImportAnalysis {
        title: title.to_string(),
        source_path: source_path.to_string(),
        storage_path: storage_path.map(str::to_string),
        bpm: detected_bpm,
        confidence: detected_confidence,
        duration_seconds,
        sample_rate_hz,
        channels,
        waveform_bins,
        beat_grid,
        bpm_curve,
        beat_grid_json,
        bpm_curve_json,
        analyzer_notes: payload.summary.clone(),
        metadata: TrackMetadata {
            file: TrackFileMetadata {
                source_kind: "file".to_string(),
                file_extension: file_extension.clone(),
                size_bytes: None,
                modified_at: None,
                checksum: None,
            },
            tags: TrackTagsMetadata {
                title: Some(title.to_string()),
                artist: None,
                album: None,
                genre: None,
                year: None,
                comment: None,
                artwork_path: None,
                music_style_id: music_style.id.clone(),
                music_style_label: music_style.label.clone(),
            },
            analysis: TrackAnalysisMetadata {
                analyzer_status: analyzer_status.clone(),
                analysis_mode: analysis_mode.clone(),
                analyzer_version: Some("maia-analyzer".to_string()),
                analyzed_at: Some(analyzed_at),
                repo_suggested_bpm: None,
                repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass"
                    .to_string(),
                notes: notes.clone(),
                key_signature: key_signature.clone(),
                energy_level,
                danceability,
                structural_patterns: structural_patterns.clone(),
            },
            file_extension,
            analyzer_status,
            analysis_mode,
            repo_suggested_bpm: None,
            repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass"
                .to_string(),
            notes,
            music_style_id: music_style.id.clone(),
            music_style_label: music_style.label.clone(),
            key_signature,
            energy_level,
            danceability,
            structural_patterns,
        },
    })
}

fn analyze_base_asset_import(
    source_kind: &str,
    source_path: &str,
    storage_path: &str,
    label: Option<&str>,
    category: &BaseAssetCategoryOption,
    reusable: bool,
) -> Result<BaseAssetImportAnalysis, String> {
    let now = now_millis().to_string();
    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("base-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "base_asset",
            "source": {
                "kind": source_kind,
                "path": storage_path
            },
            "options": {
                "baseAssetCategory": category.id,
                "baseAssetReusable": reusable
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode analyzer base asset response: {error}"))?;

    if parsed.status == "error" {
        let error = parsed
            .error
            .ok_or_else(|| "Analyzer returned an unknown base asset error.".to_string())?;
        return Err(error.message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a base asset payload.".to_string())?;
    let entry_count = metric_i64(&payload.musical_asset.metrics, "entryCount");
    let checksum = metric_string_opt(&payload.musical_asset.metrics, "checksum");
    let detected_source_kind = metric_string(&payload.musical_asset.metrics, "sourceKind");
    let mut metrics = payload.musical_asset.metrics.clone();
    if let Value::Object(record) = &mut metrics {
        record.insert(
            "storageMode".to_string(),
            Value::String("managed-copy".to_string()),
        );
        record.insert(
            "originalSourcePath".to_string(),
            Value::String(source_path.to_string()),
        );
        record.insert(
            "storagePath".to_string(),
            Value::String(storage_path.to_string()),
        );
    }
    let summary = payload.summary.clone();
    let title = label
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| payload.musical_asset.title.clone());
    let mut notes = vec![
        format!("Registered under {} category.", category.label),
        if reusable {
            "Marked as reusable for future composition workflows.".to_string()
        } else {
            "Marked as reference-only for cataloging without reuse.".to_string()
        },
        "Maia stored a managed local snapshot of this base asset during import.".to_string(),
    ];
    notes.extend(parsed.warnings.clone());

    let mut tags = payload.musical_asset.tags.clone();
    if !tags
        .iter()
        .any(|tag| tag == &format!("category:{}", category.id))
    {
        tags.push(format!("category:{}", category.id));
    }

    Ok(BaseAssetImportAnalysis {
        title,
        source_path: source_path.to_string(),
        storage_path: storage_path.to_string(),
        source_kind: if matches!(detected_source_kind.as_str(), "file" | "directory") {
            detected_source_kind
        } else {
            source_kind.to_string()
        },
        category_id: category.id.clone(),
        category_label: category.label.clone(),
        reusable,
        entry_count,
        checksum,
        confidence: payload.musical_asset.confidence,
        summary: summary.clone(),
        metrics: metrics.clone(),
        metadata: BaseAssetMetadata {
            category_id: category.id.clone(),
            category_label: category.label.clone(),
            analyzer_status: if source_kind == "directory" {
                "Base collection analyzed".to_string()
            } else {
                "Base file analyzed".to_string()
            },
            summary: metrics
                .get("detectedCategory")
                .and_then(Value::as_str)
                .map(|detected| {
                    format!(
                        "{} Detected category was {} and source kind is {}.",
                        summary, detected, source_kind
                    )
                })
                .unwrap_or(summary),
            notes,
            tags,
            metrics,
        },
    })
}

fn analyze_composition_import(
    base_asset: &BaseAssetRecord,
    reference: &CompositionReferenceDraft,
    label: Option<&str>,
    preview_audio_output_path: Option<&str>,
) -> Result<CompositionImportAnalysis, String> {
    let now = now_millis().to_string();
    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("composition-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "composition_result",
            "source": {
                "kind": base_asset.source_kind,
                "path": base_asset.storage_path
            },
            "options": {
                "baseAssetCategory": base_asset.category_id,
                "baseAssetReusable": base_asset.reusable,
                "compositionBaseAssetEntryCount": base_asset.entry_count,
                "compositionBasePlaylistId": reference.base_playlist_id,
                "compositionBasePlaylistName": reference.base_playlist_name,
                "compositionReferenceType": reference.reference_type,
                "compositionReferenceLabel": reference.reference_title,
                "compositionReferenceBpm": reference.target_bpm,
                "compositionPreviewOutputPath": preview_audio_output_path
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode analyzer composition response: {error}"))?;

    if parsed.status == "error" {
        let error = parsed
            .error
            .ok_or_else(|| "Analyzer returned an unknown composition error.".to_string())?;
        return Err(error.message);
    }

    let payload = parsed
        .payload
        .ok_or_else(|| "Analyzer did not return a composition payload.".to_string())?;
    let strategy = metric_string(&payload.musical_asset.metrics, "strategy");
    let resolved_source_path = if payload.musical_asset.source_path.trim().is_empty() {
        base_asset.source_path.clone()
    } else {
        payload.musical_asset.source_path.clone()
    };
    let title = label
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| payload.musical_asset.title.clone());
    let waveform_bins = payload.musical_asset.artifacts.waveform_bins.clone();
    let beat_grid = payload.musical_asset.artifacts.beat_grid.clone();
    let bpm_curve = payload.musical_asset.artifacts.bpm_curve.clone();
    let waveform_bins_json = serde_json::to_string(&waveform_bins)
        .map_err(|error| format!("Failed to encode composition waveform bins: {error}"))?;
    let beat_grid_json = serde_json::to_string(&beat_grid)
        .map_err(|error| format!("Failed to encode composition beat grid: {error}"))?;
    let bpm_curve_json = serde_json::to_string(&bpm_curve)
        .map_err(|error| format!("Failed to encode composition BPM curve: {error}"))?;
    let preview_audio_path = metric_string_opt(&payload.musical_asset.metrics, "previewAudioPath");
    let mut notes = vec![
        format!(
            "Built from base asset {} ({}) at {:.0} BPM.",
            base_asset.title, base_asset.category_label, reference.target_bpm
        ),
        format!(
            "Reference type is {} using {}.",
            reference.reference_type, reference.reference_title
        ),
    ];
    if let Some(playlist_name) = reference.base_playlist_name.as_deref() {
        notes.push(format!("Base playlist is {}.", playlist_name));
    }
    if !base_asset.reusable {
        notes.push(
            "The selected base asset is reference-only, so the composition remains a local sketch."
                .to_string(),
        );
    }
    if let Some(preview_audio_path) = preview_audio_path.as_deref() {
        notes.push(format!(
            "Managed preview audio rendered to {}.",
            preview_audio_path
        ));
    } else if preview_audio_output_path.is_some() {
        notes.push(
            "Preview audio could not be rendered during import, so this composition remains metadata-only for now."
                .to_string(),
        );
    }
    notes.extend(parsed.warnings.clone());

    let mut tags = payload.musical_asset.tags.clone();
    if !tags
        .iter()
        .any(|tag| tag == &format!("base-asset:{}", base_asset.category_id))
    {
        tags.push(format!("base-asset:{}", base_asset.category_id));
    }

    let analyzer_status = match reference.reference_type.as_str() {
        "track" => "Track-referenced composition plan".to_string(),
        "playlist" => "Playlist-referenced composition plan".to_string(),
        "repo" => "Repository-referenced composition plan".to_string(),
        _ => "Manual-tempo composition plan".to_string(),
    };

    Ok(CompositionImportAnalysis {
        title,
        source_path: resolved_source_path,
        preview_audio_path,
        source_kind: base_asset.source_kind.clone(),
        base_asset_id: base_asset.id.clone(),
        base_asset_title: base_asset.title.clone(),
        base_asset_category_id: base_asset.category_id.clone(),
        base_asset_category_label: base_asset.category_label.clone(),
        reference_type: reference.reference_type.clone(),
        reference_asset_id: reference.reference_asset_id.clone(),
        reference_title: reference.reference_title.clone(),
        reference_source_path: reference.reference_source_path.clone(),
        target_bpm: payload
            .musical_asset
            .suggested_bpm
            .unwrap_or(reference.target_bpm),
        confidence: payload.musical_asset.confidence,
        strategy: strategy.clone(),
        summary: payload.summary.clone(),
        waveform_bins,
        beat_grid,
        bpm_curve,
        waveform_bins_json,
        beat_grid_json,
        bpm_curve_json,
        metrics: payload.musical_asset.metrics.clone(),
        metadata: CompositionMetadata {
            base_asset_id: base_asset.id.clone(),
            base_asset_title: base_asset.title.clone(),
            base_asset_category_id: base_asset.category_id.clone(),
            base_asset_category_label: base_asset.category_label.clone(),
            base_playlist_id: reference.base_playlist_id.clone(),
            base_playlist_name: reference.base_playlist_name.clone(),
            reference_type: reference.reference_type.clone(),
            reference_asset_id: reference.reference_asset_id.clone(),
            reference_title: reference.reference_title.clone(),
            reference_source_path: reference.reference_source_path.clone(),
            analyzer_status,
            strategy,
            summary: payload.summary,
            notes,
            tags,
            metrics: payload.musical_asset.metrics,
        },
    })
}

fn build_mock_track(
    title: &str,
    source_path: &str,
    storage_path: Option<&str>,
    music_style: &MusicStyleOption,
) -> TrackImportAnalysis {
    let seed = stable_hash(&format!("{title}:{source_path}:{}", music_style.id));
    let bpm_span = u64::from(music_style.max_bpm.saturating_sub(music_style.min_bpm)) + 1;
    let bpm = f64::from(music_style.min_bpm) + f64::from((seed % bpm_span) as u32);
    let confidence = 0.56 + f64::from((seed % 28) as u32) / 100.0;
    let duration_seconds = 150.0 + f64::from((seed % 210) as u32);
    let file_extension = Path::new(source_path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| format!(".{}", value.to_lowercase()))
        .unwrap_or_else(|| ".audio".to_string());
    let waveform_bins = mock_waveform_bins(seed, 56);
    let beat_grid = mock_beat_grid(duration_seconds, bpm);
    let bpm_curve = mock_bpm_curve(duration_seconds, bpm);

    TrackImportAnalysis {
        title: title.to_string(),
        source_path: source_path.to_string(),
        storage_path: storage_path.map(str::to_string),
        bpm,
        confidence: confidence.min(0.91),
        duration_seconds: Some(duration_seconds),
        sample_rate_hz: None,
        channels: None,
        analyzer_notes: "Mock analyzer response persisted locally with waveform, beat grid, and BPM curve preview artifacts.".to_string(),
        beat_grid_json: serde_json::to_string(&beat_grid).unwrap_or_else(|_| "[]".to_string()),
        bpm_curve_json: serde_json::to_string(&bpm_curve).unwrap_or_else(|_| "[]".to_string()),
        metadata: TrackMetadata {
            file: TrackFileMetadata {
                source_kind: "file".to_string(),
                file_extension: file_extension.clone(),
                size_bytes: None,
                modified_at: None,
                checksum: None,
            },
            tags: TrackTagsMetadata {
                title: Some(title.to_string()),
                artist: None,
                album: None,
                genre: None,
                year: None,
                comment: None,
                artwork_path: None,
                music_style_id: music_style.id.clone(),
                music_style_label: music_style.label.clone(),
            },
            analysis: TrackAnalysisMetadata {
                analyzer_status: "Mock waveform + BPM ready".to_string(),
                analysis_mode: "style-prior-mock".to_string(),
                analyzer_version: Some("mock-analyzer".to_string()),
                analyzed_at: Some(now_iso()),
                repo_suggested_bpm: None,
                repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass".to_string(),
                notes: vec![
                    format!(
                        "Imported with {} prior ({}-{} BPM).",
                        music_style.label, music_style.min_bpm, music_style.max_bpm
                    ),
                    match storage_path {
                        Some(path) => format!(
                            "Maia captured a managed local snapshot for this track at {}.",
                            path
                        ),
                        None => "No managed snapshot exists for this track yet because the source file was not available during import.".to_string(),
                    },
                    "Waveform, beat grid, and BPM curve are lightweight local preview artifacts.".to_string(),
                    "Browser and demo flows mirror the same analyzer-screen structure as Tauri.".to_string(),
                ],
                key_signature: None,
                energy_level: None,
                danceability: None,
                structural_patterns: Vec::new(),
            },
            file_extension,
            analyzer_status: "Mock waveform + BPM ready".to_string(),
            analysis_mode: "style-prior-mock".to_string(),
            repo_suggested_bpm: None,
            repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass".to_string(),
            notes: vec![
                format!(
                    "Imported with {} prior ({}-{} BPM).",
                    music_style.label, music_style.min_bpm, music_style.max_bpm
                ),
                match storage_path {
                    Some(path) => format!(
                        "Maia captured a managed local snapshot for this track at {}.",
                        path
                    ),
                    None => "No managed snapshot exists for this track yet because the source file was not available during import.".to_string(),
                },
                "Waveform, beat grid, and BPM curve are lightweight local preview artifacts.".to_string(),
                "Browser and demo flows mirror the same analyzer-screen structure as Tauri.".to_string(),
            ],
            music_style_id: music_style.id.clone(),
            music_style_label: music_style.label.clone(),
            key_signature: None,
            energy_level: None,
            danceability: None,
            structural_patterns: Vec::new(),
        },
        waveform_bins,
        beat_grid,
        bpm_curve,
    }
}

fn metric_string(metrics: &Value, key: &str) -> String {
    metrics
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or("unknown")
        .to_string()
}

fn metric_string_opt(metrics: &Value, key: &str) -> Option<String> {
    metrics
        .get(key)
        .and_then(Value::as_str)
        .map(str::to_string)
        .filter(|value| !value.trim().is_empty())
}

fn metric_i64(metrics: &Value, key: &str) -> i64 {
    metrics.get(key).and_then(Value::as_i64).unwrap_or(0)
}

fn metric_i64_opt(metrics: &Value, key: &str) -> Option<i64> {
    metrics.get(key).and_then(Value::as_i64)
}

fn metric_f64(metrics: &Value, key: &str) -> Option<f64> {
    metrics.get(key).and_then(Value::as_f64)
}

fn decode_json_metric<T>(metrics: &Value, key: &str) -> Result<T, String>
where
    T: DeserializeOwned + Default,
{
    match metrics.get(key) {
        Some(value) => serde_json::from_value(value.clone())
            .map_err(|error| format!("Failed to decode metric {key}: {error}")),
        None => Ok(T::default()),
    }
}

fn mock_waveform_bins(seed: u64, length: usize) -> Vec<f64> {
    let mut state = seed;
    let mut bins = Vec::with_capacity(length);

    for index in 0..length {
        state = state
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        let raw = ((state >> 32) as f64) / (u32::MAX as f64);
        let envelope = if index < length / 2 {
            0.35 + (index as f64 / length as f64)
        } else {
            0.35 + ((length - index) as f64 / length as f64)
        };
        bins.push((raw * envelope).min(1.0));
    }

    bins
}

fn mock_beat_grid(duration_seconds: f64, bpm: f64) -> Vec<BeatGridPoint> {
    if duration_seconds <= 0.0 || bpm <= 0.0 {
        return Vec::new();
    }

    let beat_period = 60.0 / bpm;
    let mut beat_grid = Vec::new();
    let mut index = 0u32;
    let mut second = 0.18;

    while second <= duration_seconds {
        beat_grid.push(BeatGridPoint {
            index,
            second: (second * 1000.0).round() / 1000.0,
        });
        index += 1;
        second += beat_period;
    }

    beat_grid
}

fn mock_bpm_curve(duration_seconds: f64, bpm: f64) -> Vec<BpmCurvePoint> {
    if duration_seconds <= 0.0 || bpm <= 0.0 {
        return Vec::new();
    }

    let step_seconds = if duration_seconds > 120.0 { 30.0 } else { 15.0 };
    let mut points = Vec::new();
    let mut second = 0.0;

    while second < duration_seconds {
        points.push(BpmCurvePoint {
            second: (second * 1000.0).round() / 1000.0,
            bpm: (bpm * 1000.0).round() / 1000.0,
        });
        second += step_seconds;
    }

    points.push(BpmCurvePoint {
        second: (duration_seconds * 1000.0).round() / 1000.0,
        bpm: (bpm * 1000.0).round() / 1000.0,
    });

    points
}

fn stable_hash(input: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    hasher.finish()
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // format as ISO 8601 UTC without external crate
    let (y, mo, d, h, min, s) = epoch_secs_to_ymdhms(secs);
    format!("{y:04}-{mo:02}-{d:02}T{h:02}:{min:02}:{s:02}Z")
}

fn epoch_secs_to_ymdhms(secs: u64) -> (u64, u64, u64, u64, u64, u64) {
    let s = secs % 60;
    let mins = secs / 60;
    let min = mins % 60;
    let hours = mins / 60;
    let h = hours % 24;
    let total_days = hours / 24;
    // Compute Gregorian date from days since Unix epoch (simple algorithm)
    let z = total_days + 719_468;
    let era = z / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mo = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if mo <= 2 { y + 1 } else { y };
    (y, mo, d, h, min, s)
}

/// Canonicalize a source path for deduplication: expand `~`, resolve symlinks
/// if the file exists, otherwise just expand `~` to an absolute path.
fn canonical_source_path(raw: &str) -> String {
    let expanded = match expanded_input_path(raw) {
        Ok(p) => p,
        Err(_) => return raw.trim().to_string(),
    };
    // Resolve symlinks/relative segments when the file is reachable.
    expanded
        .canonicalize()
        .unwrap_or(expanded)
        .to_string_lossy()
        .to_string()
}

fn check_duplicate_source_path(conn: &Connection, source_path: &str) -> Result<bool, String> {
    let canonical = canonical_source_path(source_path);
    let mut stmt = conn
        .prepare("SELECT 1 FROM musical_assets WHERE source_path = ?1")
        .map_err(|e| format!("Failed to prepare duplicate check: {e}"))?;
    let mut rows = stmt.query(params![canonical])
        .map_err(|e| format!("Failed to execute duplicate check: {e}"))?;
    Ok(rows.next().map_err(|e| format!("Failed to read duplicate check row: {e}"))?.is_some())
}

#[tauri::command]
fn read_audio_bytes(path: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let bytes = fs::read(&path).map_err(|e| format!("Cannot read audio file: {e}"))?;
    Ok(STANDARD.encode(bytes))
}

// ---------------------------------------------------------------------------
// Frontend logging — forwards JS console messages to the terminal
// ---------------------------------------------------------------------------

#[tauri::command]
fn log_to_terminal(level: String, message: String) {
    eprintln!("{level} {message}");
}

// ---------------------------------------------------------------------------
// Background mode — hide window to tray, reveal from tray click / "Show Maia"
// ---------------------------------------------------------------------------

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn build_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

    let show_item = MenuItem::with_id(app, "show", "Show Maia", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Maia", true, None::<&str>)?;
    let menu = MenuBuilder::new(app)
        .items(&[&show_item, &quit_item])
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap_or_else(|| {
            tauri::image::Image::new(&[], 0, 0)
        }))
        .menu(&menu)
        .tooltip("Maia — Auditory Monitoring")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn main() {
    eprintln!("═══════════════════════════════════════════════════════");
    eprintln!("[MAIA:Rust] Desktop app starting — eprintln! verified");
    eprintln!("═══════════════════════════════════════════════════════");
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(SessionRegistry::default())))
        .setup(|app| {
            build_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide to background instead of quitting so the monitor keeps running.
                // The user can quit via the system tray "Quit Maia" menu item.
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            bootstrap_manifest,
            run_analyzer,
            pick_track_source_path,
            pick_repository_directory,
            pick_repository_file,
            pick_export_save_path,
            pick_stems_export_directory,
            export_composition_file,
            export_composition_stems,
            poll_log_stream,
            start_stream_session,
            stop_stream_session,
            list_stream_sessions,
            poll_stream_session,
            ingest_stream_chunk,
            create_persisted_session,
            list_persisted_sessions,
            get_persisted_session,
            update_persisted_session_status,
            update_persisted_session_cursor,
            delete_persisted_session,
            insert_session_event,
            list_session_events,
            upsert_session_bookmark,
            list_session_bookmarks,
            delete_session_bookmark,
            pick_base_asset_path,
            list_tracks,
            list_playlists,
            import_track,
            save_playlist,
            delete_playlist,
            update_track_performance,
            update_track_analysis,
            seed_demo_tracks,
            list_base_assets,
            import_base_asset,
            list_compositions,
            import_composition,
            list_repositories,
            import_repository,
            discover_repository_logs,
            read_audio_bytes,
            log_to_terminal,
            hide_window,
            show_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running Maia desktop");
}
