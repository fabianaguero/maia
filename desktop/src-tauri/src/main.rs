use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const CONTRACT_VERSION: &str = "1.0";
const SCHEMA_SQL: &str = include_str!("../../../database/schema.sql");

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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LibraryTrack {
    id: String,
    title: String,
    source_path: String,
    imported_at: String,
    bpm: Option<f64>,
    bpm_confidence: f64,
    duration_seconds: Option<f64>,
    waveform_bins: Vec<f64>,
    analyzer_status: String,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    file_extension: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportTrackInput {
    title: String,
    source_path: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct TrackMetadata {
    file_extension: String,
    analyzer_status: String,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
}

struct MockTrackAnalysis {
    bpm: f64,
    confidence: f64,
    duration_seconds: f64,
    waveform_bins: Vec<f64>,
    metadata: TrackMetadata,
    analyzer_notes: String,
}

#[tauri::command]
fn bootstrap_manifest(app_handle: AppHandle) -> Result<BootstrapManifest, String> {
    let repo_root = repo_root();
    let analyzer_python = analyzer_python(&repo_root);
    let database_path = database_path(&app_handle)?;

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
    })
}

#[tauri::command]
fn run_analyzer(request: Value) -> Result<Value, String> {
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

    let request_json = serde_json::to_string(&request)
        .map_err(|error| format!("Invalid request JSON: {error}"))?;

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

#[tauri::command]
fn list_tracks(app_handle: AppHandle) -> Result<Vec<LibraryTrack>, String> {
    let conn = open_database(&app_handle)?;
    read_tracks(&conn)
}

#[tauri::command]
fn import_track(app_handle: AppHandle, input: ImportTrackInput) -> Result<LibraryTrack, String> {
    let conn = open_database(&app_handle)?;
    insert_track(&conn, input)
}

#[tauri::command]
fn seed_demo_tracks(app_handle: AppHandle) -> Result<Vec<LibraryTrack>, String> {
    let conn = open_database(&app_handle)?;

    if count_tracks(&conn)? > 0 {
        return read_tracks(&conn);
    }

    for draft in [
        ImportTrackInput {
            title: "Night Drive".to_string(),
            source_path: "~/Music/night-drive.wav".to_string(),
        },
        ImportTrackInput {
            title: "Circuit Azul".to_string(),
            source_path: "~/Music/circuit-azul.mp3".to_string(),
        },
        ImportTrackInput {
            title: "Jakarta Pulse".to_string(),
            source_path: "~/Music/jakarta-pulse.flac".to_string(),
        },
    ] {
        insert_track(&conn, draft)?;
    }

    read_tracks(&conn)
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

fn open_database(app_handle: &AppHandle) -> Result<Connection, String> {
    let path = database_path(app_handle)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create app data directory: {error}"))?;
    }

    let conn = Connection::open(&path)
        .map_err(|error| format!("Failed to open SQLite database {}: {error}", path.display()))?;

    conn.execute_batch(SCHEMA_SQL)
        .map_err(|error| format!("Failed to initialize SQLite schema: {error}"))?;

    Ok(conn)
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

fn count_tracks(conn: &Connection) -> Result<i64, String> {
    conn.query_row(
        "SELECT COUNT(*) FROM musical_assets WHERE asset_type = 'track_analysis'",
        [],
        |row| row.get(0),
    )
    .map_err(|error| format!("Failed to count tracks: {error}"))
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
                t.duration_seconds,
                t.waveform_bins_json
            FROM musical_assets m
            INNER JOIN track_analyses t ON t.asset_id = m.id
            WHERE m.asset_type = 'track_analysis'
            ORDER BY m.created_at DESC
            ",
        )
        .map_err(|error| format!("Failed to prepare track query: {error}"))?;

    let mut rows = statement
        .query([])
        .map_err(|error| format!("Failed to query tracks: {error}"))?;
    let mut tracks = Vec::new();

    while let Some(row) = rows
        .next()
        .map_err(|error| format!("Failed to iterate track rows: {error}"))?
    {
        let metadata_json: String = row
            .get(6)
            .map_err(|error| format!("Failed to read track metadata: {error}"))?;
        let waveform_json: String = row
            .get(8)
            .map_err(|error| format!("Failed to read waveform bins: {error}"))?;
        let metadata: TrackMetadata = serde_json::from_str(&metadata_json)
            .map_err(|error| format!("Failed to decode track metadata JSON: {error}"))?;
        let waveform_bins: Vec<f64> = serde_json::from_str(&waveform_json)
            .map_err(|error| format!("Failed to decode waveform JSON: {error}"))?;

        tracks.push(LibraryTrack {
            id: row
                .get(0)
                .map_err(|error| format!("Failed to read track id: {error}"))?,
            title: row
                .get(1)
                .map_err(|error| format!("Failed to read track title: {error}"))?,
            source_path: row
                .get(2)
                .map_err(|error| format!("Failed to read track source path: {error}"))?,
            bpm: row
                .get(3)
                .map_err(|error| format!("Failed to read track BPM: {error}"))?,
            bpm_confidence: row
                .get(4)
                .map_err(|error| format!("Failed to read track confidence: {error}"))?,
            imported_at: row
                .get(5)
                .map_err(|error| format!("Failed to read import timestamp: {error}"))?,
            duration_seconds: row
                .get(7)
                .map_err(|error| format!("Failed to read duration: {error}"))?,
            waveform_bins,
            analyzer_status: metadata.analyzer_status,
            repo_suggested_bpm: metadata.repo_suggested_bpm,
            repo_suggested_status: metadata.repo_suggested_status,
            notes: metadata.notes,
            file_extension: metadata.file_extension,
        });
    }

    Ok(tracks)
}

fn insert_track(conn: &Connection, input: ImportTrackInput) -> Result<LibraryTrack, String> {
    let title = input.title.trim();
    let source_path = input.source_path.trim();

    if title.is_empty() {
        return Err("Track title is required.".to_string());
    }

    if source_path.is_empty() {
        return Err("Track source path is required.".to_string());
    }

    let now = now_millis().to_string();
    let mock = build_mock_track(title, source_path);
    let metadata_json = serde_json::to_string(&mock.metadata)
        .map_err(|error| format!("Failed to encode track metadata: {error}"))?;
    let waveform_json = serde_json::to_string(&mock.waveform_bins)
        .map_err(|error| format!("Failed to encode waveform bins: {error}"))?;
    let tags_json = serde_json::json!([
        "track-analysis",
        "imported",
        "mock-analyzer",
        mock.metadata.file_extension.clone()
    ])
    .to_string();
    let id = format!(
        "trk-{}-{:x}",
        now,
        stable_hash(&format!("{title}:{source_path}:{now}"))
    );

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
            title,
            source_path,
            mock.bpm,
            mock.confidence,
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
            duration_seconds,
            sample_rate_hz,
            channels,
            waveform_bins_json,
            beat_grid_json,
            bpm_curve_json,
            analyzer_notes
        ) VALUES (?1, ?2, NULL, NULL, ?3, '[]', '[]', ?4)
        ",
        params![
            &id,
            mock.duration_seconds,
            waveform_json,
            mock.analyzer_notes
        ],
    )
    .map_err(|error| format!("Failed to insert track analysis: {error}"))?;

    Ok(LibraryTrack {
        id,
        title: title.to_string(),
        source_path: source_path.to_string(),
        imported_at: now,
        bpm: Some(mock.bpm),
        bpm_confidence: mock.confidence,
        duration_seconds: Some(mock.duration_seconds),
        waveform_bins: mock.waveform_bins,
        analyzer_status: mock.metadata.analyzer_status,
        repo_suggested_bpm: mock.metadata.repo_suggested_bpm,
        repo_suggested_status: mock.metadata.repo_suggested_status,
        notes: mock.metadata.notes,
        file_extension: mock.metadata.file_extension,
    })
}

fn build_mock_track(title: &str, source_path: &str) -> MockTrackAnalysis {
    let seed = stable_hash(&format!("{title}:{source_path}"));
    let bpm = 96.0 + f64::from((seed % 44) as u32);
    let confidence = 0.56 + f64::from((seed % 28) as u32) / 100.0;
    let duration_seconds = 150.0 + f64::from((seed % 210) as u32);
    let file_extension = Path::new(source_path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| format!(".{}", value.to_lowercase()))
        .unwrap_or_else(|| ".audio".to_string());
    let waveform_bins = mock_waveform_bins(seed, 56);

    MockTrackAnalysis {
        bpm,
        confidence: confidence.min(0.91),
        duration_seconds,
        analyzer_notes: "Mock analyzer response persisted locally. Advanced waveform rendering and beat grid extraction are deferred.".to_string(),
        metadata: TrackMetadata {
            file_extension,
            analyzer_status: "Mock waveform + BPM ready".to_string(),
            repo_suggested_bpm: None,
            repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass".to_string(),
            notes: vec![
                "Waveform panel uses placeholder bins only.".to_string(),
                "Beat grid and BPM curve remain intentionally lightweight in MVP.".to_string(),
            ],
        },
        waveform_bins,
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            bootstrap_manifest,
            run_analyzer,
            list_tracks,
            import_track,
            seed_demo_tracks
        ])
        .run(tauri::generate_context!())
        .expect("error while running Maia desktop");
}
