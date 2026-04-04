use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const CONTRACT_VERSION: &str = "1.0";
const SCHEMA_SQL: &str = include_str!("../../../database/schema.sql");
const DEFAULT_MUSIC_STYLE_CATALOG_JSON: &str =
    include_str!("../../src/config/music-styles.json");
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
struct RepositoryAnalysis {
    id: String,
    title: String,
    source_path: String,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportTrackInput {
    title: String,
    source_path: String,
    music_style_id: String,
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
#[serde(rename_all = "camelCase", default)]
struct TrackMetadata {
    file_extension: String,
    analyzer_status: String,
    analysis_mode: String,
    repo_suggested_bpm: Option<f64>,
    repo_suggested_status: String,
    notes: Vec<String>,
    music_style_id: String,
    music_style_label: String,
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

struct TrackImportAnalysis {
    title: String,
    source_path: String,
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
fn import_track(app_handle: AppHandle, input: ImportTrackInput) -> Result<LibraryTrack, String> {
    let conn = open_database(&app_handle)?;
    let music_style_catalog = load_music_style_catalog(&repo_root());
    insert_track(&conn, input, &music_style_catalog)
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
    insert_base_asset(&conn, input, &category_catalog)
}

#[tauri::command]
fn seed_demo_tracks(app_handle: AppHandle) -> Result<Vec<LibraryTrack>, String> {
    let conn = open_database(&app_handle)?;
    let music_style_catalog = load_music_style_catalog(&repo_root());

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
        insert_track(&conn, draft, &music_style_catalog)?;
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
    insert_repository(&conn, input)
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
    migrate_database(&conn)?;
    conn.execute_batch(SCHEMA_SQL)
        .map_err(|error| format!("Failed to refresh SQLite schema after migration: {error}"))?;

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
          source_path TEXT NOT NULL,
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

        if let Some(selected) = pick_with_kdialog(&kind, &default_path, title, filter)? {
            return Ok(Some(selected));
        }

        if let Some(selected) = pick_with_zenity(&kind, &default_path, title, filter)? {
            return Ok(Some(selected));
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
fn pick_with_kdialog(
    kind: &NativePickerKind,
    default_path: &str,
    title: &str,
    filter: Option<&str>,
) -> Result<Option<String>, String> {
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
    }

    run_native_picker_command("kdialog", &args)
}

#[cfg(target_os = "linux")]
fn pick_with_zenity(
    kind: &NativePickerKind,
    default_path: &str,
    title: &str,
    filter: Option<&str>,
) -> Result<Option<String>, String> {
    let mut args = vec!["--file-selection", "--title", title, "--filename", default_path];

    if matches!(kind, NativePickerKind::Directory) {
        args.push("--directory");
    }

    if let Some(filter) = filter {
        args.push("--file-filter");
        args.push(filter);
    }

    run_native_picker_command("zenity", &args)
}

#[cfg(target_os = "linux")]
fn run_native_picker_command(command: &str, args: &[&str]) -> Result<Option<String>, String> {
    let output = match Command::new(command).args(args).output() {
        Ok(output) => output,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(format!("Failed to launch {command}: {error}")),
    };

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("{command} returned invalid UTF-8: {error}"))?;
    let selected = stdout.trim().to_string();

    if output.status.success() {
        if selected.is_empty() {
            return Ok(None);
        }

        return Ok(Some(selected));
    }

    if selected.is_empty() {
        return Ok(None);
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
    initial_path
        .as_deref()
        .map(str::trim)
        .filter(|path| !path.is_empty())
        .map(str::to_string)
        .or_else(|| {
            env::var("HOME")
                .ok()
                .map(|path| path.trim().to_string())
                .filter(|path| !path.is_empty())
        })
        .unwrap_or_else(|| repo_root().display().to_string())
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
                && catalog.base_asset_categories.iter().any(|category| {
                    category.id == catalog.default_base_asset_category_id
                })
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
    let music_style_id = metadata.music_style_id.trim();
    if music_style_id.is_empty() {
        "not-set".to_string()
    } else {
        music_style_id.to_string()
    }
}

fn normalized_music_style_label(metadata: &TrackMetadata) -> String {
    let music_style_label = metadata.music_style_label.trim();
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
    let analysis_mode = metadata.analysis_mode.trim();
    if analysis_mode.is_empty() {
        "unknown".to_string()
    } else {
        analysis_mode.to_string()
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
                t.waveform_bins_json,
                t.beat_grid_json,
                t.bpm_curve_json
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
        let beat_grid_json: String = row
            .get(9)
            .map_err(|error| format!("Failed to read beat grid: {error}"))?;
        let bpm_curve_json: String = row
            .get(10)
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
            beat_grid,
            bpm_curve,
            analyzer_status: metadata.analyzer_status,
            repo_suggested_bpm: metadata.repo_suggested_bpm,
            repo_suggested_status: metadata.repo_suggested_status,
            notes: metadata.notes,
            file_extension: metadata.file_extension,
            analysis_mode,
            music_style_id,
            music_style_label,
        });
    }

    Ok(tracks)
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
            .get(12)
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
                .get(11)
                .map_err(|error| format!("Failed to read repository summary: {error}"))?,
            analyzer_status: metadata.analyzer_status,
            build_system: row
                .get::<_, Option<String>>(7)
                .map_err(|error| format!("Failed to read build system: {error}"))?
                .unwrap_or_else(|| "unknown".to_string()),
            primary_language: row
                .get::<_, Option<String>>(8)
                .map_err(|error| format!("Failed to read primary language: {error}"))?
                .unwrap_or_else(|| "unknown".to_string()),
            java_file_count: row
                .get(9)
                .map_err(|error| format!("Failed to read Java file count: {error}"))?,
            test_file_count: row
                .get(10)
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
) -> Result<LibraryTrack, String> {
    let title = input.title.trim();
    let source_path = input.source_path.trim();
    let music_style_id = input.music_style_id.trim();

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
    let analysis = analyze_track_import(title, source_path, music_style)?;
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
    let id = format!(
        "trk-{}-{:x}",
        now,
        stable_hash(&format!("{title}:{source_path}:{music_style_id}:{now}"))
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
            duration_seconds,
            sample_rate_hz,
            channels,
            waveform_bins_json,
            beat_grid_json,
            bpm_curve_json,
            analyzer_notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            &id,
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

    Ok(LibraryTrack {
        id,
        title: analysis.title,
        source_path: analysis.source_path,
        imported_at: now,
        bpm: Some(analysis.bpm),
        bpm_confidence: analysis.confidence,
        duration_seconds: analysis.duration_seconds,
        waveform_bins: analysis.waveform_bins,
        beat_grid: analysis.beat_grid,
        bpm_curve: analysis.bpm_curve,
        analyzer_status: analysis.metadata.analyzer_status,
        repo_suggested_bpm: analysis.metadata.repo_suggested_bpm,
        repo_suggested_status: analysis.metadata.repo_suggested_status,
        notes: analysis.metadata.notes,
        file_extension: analysis.metadata.file_extension,
        analysis_mode: analysis.metadata.analysis_mode,
        music_style_id: analysis.metadata.music_style_id,
        music_style_label: analysis.metadata.music_style_label,
    })
}

fn insert_base_asset(
    conn: &Connection,
    input: ImportBaseAssetInput,
    category_catalog: &BaseAssetCategoryCatalog,
) -> Result<BaseAssetRecord, String> {
    let source_kind = input.source_kind.trim();
    let source_path = input.source_path.trim();
    let category_id = input.category_id.trim();
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
    let analysis = analyze_base_asset_import(
        source_kind,
        source_path,
        label.as_deref(),
        category,
        input.reusable,
    )?;
    let metadata_json = serde_json::to_string(&analysis.metadata)
        .map_err(|error| format!("Failed to encode base asset metadata: {error}"))?;
    let tags_json = serde_json::to_string(&analysis.metadata.tags)
        .map_err(|error| format!("Failed to encode base asset tags: {error}"))?;
    let id = format!(
        "bas-{}-{:x}",
        now,
        stable_hash(&format!(
            "{}:{}:{}:{}:{}",
            source_kind, source_path, category.id, input.reusable, now
        ))
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

fn insert_repository(
    conn: &Connection,
    input: ImportRepositoryInput,
) -> Result<RepositoryAnalysis, String> {
    let source_kind = input.source_kind.trim();
    let source_path = input.source_path.trim();
    let import_label = input
        .label
        .as_deref()
        .map(str::trim)
        .filter(|label| !label.is_empty())
        .map(str::to_string);

    if !matches!(source_kind, "directory" | "url") {
        return Err("Repository source kind must be 'directory' or 'url'.".to_string());
    }

    if source_path.is_empty() {
        return Err("Repository path or URL is required.".to_string());
    }

    let now = now_millis().to_string();
    let mut source = serde_json::Map::new();
    source.insert("kind".to_string(), Value::String(source_kind.to_string()));
    source.insert("path".to_string(), Value::String(source_path.to_string()));
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
    let metadata = RepositoryMetadata {
        source_kind: source_kind.to_string(),
        analyzer_status: if source_kind == "url" {
            "Remote repository reference analyzed".to_string()
        } else {
            "Filesystem repository analyzed".to_string()
        },
        notes: parsed.warnings.clone(),
        tags: payload.musical_asset.tags.clone(),
        import_label: import_label.clone(),
    };
    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|error| format!("Failed to encode repository metadata: {error}"))?;
    let asset_title = payload.musical_asset.title.clone();
    let asset_source_path = payload.musical_asset.source_path.clone();
    let suggested_bpm = payload.musical_asset.suggested_bpm;
    let confidence = payload.musical_asset.confidence;
    let tags = payload.musical_asset.tags.clone();
    let metrics = payload.musical_asset.metrics.clone();
    let metrics_json = metrics.to_string();
    let tags_json = serde_json::to_string(&tags)
        .map_err(|error| format!("Failed to encode repository tags: {error}"))?;
    let id = format!(
        "repo-{}-{:x}",
        now,
        stable_hash(&format!("{source_kind}:{source_path}:{now}"))
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
        ) VALUES (?1, 'repo_analysis', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
        ",
        params![
            &id,
            &asset_title,
            &asset_source_path,
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
            build_system,
            primary_language,
            java_file_count,
            test_file_count,
            heuristic_summary,
            metric_snapshot_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            &id,
            source_path,
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
        source_path: asset_source_path,
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
        notes: parsed.warnings,
        tags,
        metrics,
    })
}

fn analyze_track_import(
    title: &str,
    source_path: &str,
    music_style: &MusicStyleOption,
) -> Result<TrackImportAnalysis, String> {
    let fallback = build_mock_track(title, source_path, music_style);
    let now = now_millis().to_string();
    let request = json!({
        "contractVersion": CONTRACT_VERSION,
        "requestId": format!("track-{now}"),
        "action": "analyze",
        "payload": {
            "assetType": "track_analysis",
            "source": {
                "kind": "file",
                "path": source_path
            },
            "options": {
                "waveformBins": 32
            }
        }
    });
    let response = execute_analyzer_request(&request)?;
    let parsed: AnalyzerResponseEnvelope = serde_json::from_value(response)
        .map_err(|error| format!("Failed to decode analyzer track response: {error}"))?;

    if parsed.status == "error" {
        let error = parsed.error.ok_or_else(|| {
            "Analyzer returned an unknown track error.".to_string()
        })?;

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
    let resolved_source_path = if payload.musical_asset.source_path.trim().is_empty() {
        source_path.to_string()
    } else {
        payload.musical_asset.source_path.clone()
    };
    let file_extension = Path::new(&resolved_source_path)
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
    let duration_seconds = metric_f64(&payload.musical_asset.metrics, "durationSeconds")
        .or(fallback.duration_seconds);
    let sample_rate_hz = metric_i64_opt(&payload.musical_asset.metrics, "sampleRateHz");
    let channels = metric_i64_opt(&payload.musical_asset.metrics, "channels");
    let beat_grid_json = serde_json::to_string(&beat_grid)
        .map_err(|error| format!("Failed to encode beat grid: {error}"))?;
    let bpm_curve_json = serde_json::to_string(&bpm_curve)
        .map_err(|error| format!("Failed to encode BPM curve: {error}"))?;
    let analyzer_status = match analysis_mode.as_str() {
        "embedded-heuristic" => "Embedded waveform + BPM heuristic".to_string(),
        "hash-stub" => "Hash waveform stub + style BPM prior".to_string(),
        _ => "Track analysis imported".to_string(),
    };
    let mut notes = vec![
        format!(
            "Imported with {} prior ({}-{} BPM).",
            music_style.label, music_style.min_bpm, music_style.max_bpm
        ),
    ];
    if payload.musical_asset.suggested_bpm.is_some() {
        notes.push("Detected BPM came from embedded audio heuristics inside the analyzer.".to_string());
    } else {
        notes.push("Detected BPM still uses the selected style prior because tempo heuristics were unavailable for this file.".to_string());
    }
    notes.push("Waveform, beat grid, and BPM curve are available in the analyzer screen as persisted local artifacts.".to_string());
    notes.extend(parsed.warnings.clone());

    Ok(TrackImportAnalysis {
        title: title.to_string(),
        source_path: resolved_source_path,
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
            file_extension,
            analyzer_status,
            analysis_mode,
            repo_suggested_bpm: None,
            repo_suggested_status: "Waiting for repository heuristics in a future analyzer pass".to_string(),
            notes,
            music_style_id: music_style.id.clone(),
            music_style_label: music_style.label.clone(),
        },
    })
}

fn analyze_base_asset_import(
    source_kind: &str,
    source_path: &str,
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
                "path": source_path
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
    let resolved_source_path = if payload.musical_asset.source_path.trim().is_empty() {
        source_path.to_string()
    } else {
        payload.musical_asset.source_path.clone()
    };
    let entry_count = metric_i64(&payload.musical_asset.metrics, "entryCount");
    let checksum = metric_string_opt(&payload.musical_asset.metrics, "checksum");
    let detected_source_kind = metric_string(&payload.musical_asset.metrics, "sourceKind");
    let metrics = payload.musical_asset.metrics.clone();
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
        "Base assets are stored by reference in MVP; managed copies are deferred.".to_string(),
    ];
    notes.extend(parsed.warnings.clone());

    let mut tags = payload.musical_asset.tags.clone();
    if !tags.iter().any(|tag| tag == &format!("category:{}", category.id)) {
        tags.push(format!("category:{}", category.id));
    }

    Ok(BaseAssetImportAnalysis {
        title,
        source_path: resolved_source_path.clone(),
        storage_path: resolved_source_path,
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

fn build_mock_track(title: &str, source_path: &str, music_style: &MusicStyleOption) -> TrackImportAnalysis {
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
        bpm,
        confidence: confidence.min(0.91),
        duration_seconds: Some(duration_seconds),
        sample_rate_hz: None,
        channels: None,
        analyzer_notes: "Mock analyzer response persisted locally with waveform, beat grid, and BPM curve preview artifacts.".to_string(),
        beat_grid_json: serde_json::to_string(&beat_grid).unwrap_or_else(|_| "[]".to_string()),
        bpm_curve_json: serde_json::to_string(&bpm_curve).unwrap_or_else(|_| "[]".to_string()),
        metadata: TrackMetadata {
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
                "Waveform, beat grid, and BPM curve are lightweight local preview artifacts.".to_string(),
                "Browser and demo flows mirror the same analyzer-screen structure as Tauri.".to_string(),
            ],
            music_style_id: music_style.id.clone(),
            music_style_label: music_style.label.clone(),
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            bootstrap_manifest,
            run_analyzer,
            pick_track_source_path,
            pick_repository_directory,
            pick_base_asset_path,
            list_tracks,
            import_track,
            seed_demo_tracks,
            list_base_assets,
            import_base_asset,
            list_repositories,
            import_repository
        ])
        .run(tauri::generate_context!())
        .expect("error while running Maia desktop");
}
