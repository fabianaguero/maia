/** Core musical asset types based on domain model */

export type AssetType =
  | "track_analysis"
  | "repo_analysis"
  | "base_asset"
  | "composition_result";

export interface MusicalAsset {
  id: string;
  type: AssetType;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface BeatInfo {
  time: number;    // seconds
  strength: number; // 0-1
  beat_number: number;
}

export interface WaveformData {
  samples: number[];  // normalized -1 to 1
  sample_rate: number;
  duration: number;
  peaks: number[];    // downsampled peaks for display
}

export interface TrackAnalysis extends MusicalAsset {
  type: "track_analysis";
  file_path: string;
  duration: number;
  bpm: number;
  bpm_confidence: number;
  bpm_curve: BpmPoint[];
  key: string;
  scale: string;
  beats: BeatInfo[];
  beat_grid: BeatGrid;
  waveform: WaveformData;
  energy: number;
  danceability: number;
  suggested_bpm: number | null;
  patterns: MusicPattern[];
}

export interface BpmPoint {
  time: number;
  bpm: number;
}

export interface BeatGrid {
  first_beat: number;
  beat_interval: number;
  beats: number[];
  time_signature: number;
}

export interface MusicPattern {
  type: "loop" | "break" | "drop" | "intro" | "outro";
  start: number;
  end: number;
  confidence: number;
  label: string;
}

export interface RepoAnalysis extends MusicalAsset {
  type: "repo_analysis";
  repo_path: string;
  language_stats: Record<string, number>;
  musical_references: MusicalReference[];
  inferred_bpm: number | null;
  patterns: CodePattern[];
  bases: ReuseableBase[];
}

export interface MusicalReference {
  file: string;
  line: number;
  type: "bpm" | "key" | "scale" | "note" | "rhythm";
  value: string;
  context: string;
}

export interface CodePattern {
  name: string;
  occurrences: number;
  files: string[];
}

export interface ReuseableBase {
  id: string;
  source_file: string;
  start_line: number;
  end_line: number;
  description: string;
  musical_quality: number;
}

export interface BaseAsset extends MusicalAsset {
  type: "base_asset";
  source_track_id: string;
  start_time: number;
  end_time: number;
  loop_compatible: boolean;
  key: string;
  bpm: number;
  tags: string[];
}

export interface CompositionResult extends MusicalAsset {
  type: "composition_result";
  source_assets: string[];
  structure: CompositionSection[];
  total_duration: number;
  export_path: string | null;
}

export interface CompositionSection {
  asset_id: string;
  type: "intro" | "verse" | "chorus" | "bridge" | "outro";
  start: number;
  duration: number;
  transition: "cut" | "crossfade" | "beatmatch";
}

export type AnyMusicalAsset =
  | TrackAnalysis
  | RepoAnalysis
  | BaseAsset
  | CompositionResult;
