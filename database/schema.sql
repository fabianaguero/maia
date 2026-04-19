PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS musical_assets (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_musical_assets_source_path 
  ON musical_assets (source_path);

CREATE TABLE IF NOT EXISTS track_analyses (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  storage_path TEXT,
  duration_seconds REAL,
  sample_rate_hz INTEGER,
  channels INTEGER,
  waveform_bins_json TEXT NOT NULL DEFAULT '[]',
  beat_grid_json TEXT NOT NULL DEFAULT '[]',
  bpm_curve_json TEXT NOT NULL DEFAULT '[]',
  analyzer_notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS track_library_states (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  color TEXT,
  rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  play_count INTEGER NOT NULL DEFAULT 0,
  last_played_at TEXT,
  bpm_lock INTEGER NOT NULL DEFAULT 0 CHECK (bpm_lock IN (0, 1)),
  grid_lock INTEGER NOT NULL DEFAULT 0 CHECK (grid_lock IN (0, 1)),
  main_cue_second REAL,
  hot_cues_json TEXT NOT NULL DEFAULT '[]',
  memory_cues_json TEXT NOT NULL DEFAULT '[]',
  saved_loops_json TEXT NOT NULL DEFAULT '[]',
  missing_state TEXT NOT NULL DEFAULT 'available' CHECK (missing_state IN ('available', 'missing')),
  file_size_bytes INTEGER,
  source_modified_at TEXT,
  source_checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_track_library_states_last_played
  ON track_library_states (last_played_at DESC);

CREATE TABLE IF NOT EXISTS base_track_playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS base_track_playlist_items (
  playlist_id TEXT NOT NULL REFERENCES base_track_playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES musical_assets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_base_track_playlist_items_track
  ON base_track_playlist_items (track_id);

CREATE TABLE IF NOT EXISTS repo_analyses (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  repo_path TEXT NOT NULL,
  storage_path TEXT,
  build_system TEXT,
  primary_language TEXT,
  java_file_count INTEGER NOT NULL DEFAULT 0,
  test_file_count INTEGER NOT NULL DEFAULT 0,
  heuristic_summary TEXT NOT NULL DEFAULT '',
  metric_snapshot_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS base_assets (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL,
  checksum TEXT,
  reusable INTEGER NOT NULL DEFAULT 1 CHECK (reusable IN (0, 1))
);

CREATE TABLE IF NOT EXISTS composition_results (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  base_asset_id TEXT NOT NULL REFERENCES musical_assets(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('track', 'repo', 'manual')),
  reference_asset_id TEXT REFERENCES musical_assets(id) ON DELETE SET NULL,
  target_bpm REAL NOT NULL,
  strategy TEXT NOT NULL,
  arrangement_summary TEXT NOT NULL DEFAULT '',
  export_path TEXT,
  waveform_bins_json TEXT NOT NULL DEFAULT '[]',
  beat_grid_json TEXT NOT NULL DEFAULT '[]',
  bpm_curve_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id TEXT PRIMARY KEY,
  asset_id TEXT REFERENCES musical_assets(id) ON DELETE SET NULL,
  request_json TEXT NOT NULL,
  response_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  label TEXT,
  source_id TEXT REFERENCES musical_assets(id) ON DELETE SET NULL,
  track_id TEXT REFERENCES musical_assets(id) ON DELETE SET NULL,
  playlist_id TEXT REFERENCES base_track_playlists(id) ON DELETE SET NULL,
  adapter_kind TEXT NOT NULL DEFAULT 'file',
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'play')),
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('active', 'paused', 'stopped')),
  file_cursor INTEGER NOT NULL DEFAULT 0,
  total_polls INTEGER NOT NULL DEFAULT 0,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_anomalies INTEGER NOT NULL DEFAULT 0,
  last_bpm REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_updated
  ON sessions (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS session_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  poll_index INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  from_offset INTEGER NOT NULL DEFAULT 0,
  to_offset INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT '',
  suggested_bpm REAL,
  confidence REAL NOT NULL DEFAULT 0,
  dominant_level TEXT NOT NULL DEFAULT '',
  line_count INTEGER NOT NULL DEFAULT 0,
  anomaly_count INTEGER NOT NULL DEFAULT 0,
  level_counts_json TEXT NOT NULL DEFAULT '{}',
  anomaly_markers_json TEXT NOT NULL DEFAULT '[]',
  top_components_json TEXT NOT NULL DEFAULT '[]',
  sonification_cues_json TEXT NOT NULL DEFAULT '[]',
  parsed_lines_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_session_events_session_poll
  ON session_events (session_id, poll_index);

CREATE TABLE IF NOT EXISTS session_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  replay_window_index INTEGER NOT NULL,
  event_index INTEGER,
  label TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  bookmark_tag TEXT,
  suggested_style_profile_id TEXT,
  suggested_mutation_profile_id TEXT,
  track_id TEXT,
  track_title TEXT,
  track_second REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_bookmarks_session_window
  ON session_bookmarks (session_id, replay_window_index);

CREATE INDEX IF NOT EXISTS idx_musical_assets_type_created
  ON musical_assets (asset_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status_created
  ON analysis_jobs (status, created_at DESC);
