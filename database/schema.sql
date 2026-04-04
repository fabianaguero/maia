PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS musical_assets (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('track_analysis', 'repo_analysis', 'base_asset', 'composition_result')),
  title TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('file', 'directory')),
  suggested_bpm REAL,
  confidence REAL NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS track_analyses (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  duration_seconds REAL,
  sample_rate_hz INTEGER,
  channels INTEGER,
  waveform_bins_json TEXT NOT NULL DEFAULT '[]',
  beat_grid_json TEXT NOT NULL DEFAULT '[]',
  bpm_curve_json TEXT NOT NULL DEFAULT '[]',
  analyzer_notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS repo_analyses (
  asset_id TEXT PRIMARY KEY REFERENCES musical_assets(id) ON DELETE CASCADE,
  repo_path TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_musical_assets_type_created
  ON musical_assets (asset_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status_created
  ON analysis_jobs (status, created_at DESC);
