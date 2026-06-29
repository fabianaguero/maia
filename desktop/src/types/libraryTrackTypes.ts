export interface BeatGridPoint {
  index: number;
  second: number;
}

export interface BpmCurvePoint {
  second: number;
  bpm: number;
}

export interface TrackStructuralPattern {
  type: string;
  start: number;
  end: number;
  confidence: number;
  label: string;
}

export type TrackAvailabilityState = "available" | "missing";
export type TrackPlaybackSource = "managed_snapshot" | "source_file" | "unavailable";

export interface TrackCuePoint {
  id: string;
  slot: number | null;
  second: number;
  label: string;
  kind: "main" | "hot" | "memory";
  color: string | null;
}

export interface TrackSavedLoop {
  id: string;
  slot: number | null;
  startSecond: number;
  endSecond: number;
  label: string;
  color: string | null;
  locked: boolean;
}

export interface VisualizationCuePoint {
  second: number;
  label: string;
  type: string;
  excerpt?: string;
}

export interface VisualizationRegionPoint {
  id: string;
  startSecond: number;
  endSecond: number;
  label: string;
  type: string;
  color?: string | null;
  excerpt?: string;
}

export interface AssetVisualization {
  waveform: number[];
  hotCues: VisualizationCuePoint[];
  beatGrid: BeatGridPoint[];
  complexityCurve?: number[];
}

export interface TrackFileRecord {
  sourcePath: string;
  storagePath: string | null;
  sourceKind: "file";
  fileExtension: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
  checksum: string | null;
  availabilityState: TrackAvailabilityState;
  playbackSource: TrackPlaybackSource;
}

export interface TrackTagsRecord {
  title: string;
  artist: string | null;
  album: string | null;
  genre: string | null;
  year: number | null;
  comment: string | null;
  artworkPath: string | null;
  musicStyleId: string;
  musicStyleLabel: string;
}

export interface TrackAnalysisRecord {
  importedAt: string;
  bpm: number | null;
  bpmConfidence: number;
  durationSeconds: number | null;
  waveformBins: number[];
  beatGrid: BeatGridPoint[];
  bpmCurve: BpmCurvePoint[];
  analyzerStatus: string;
  analysisMode: string;
  analyzerVersion: string | null;
  analyzedAt: string | null;
  repoSuggestedBpm: number | null;
  repoSuggestedStatus: string;
  notes: string[];
  keySignature: string | null;
  energyLevel: number | null;
  danceability: number | null;
  structuralPatterns: TrackStructuralPattern[];
}

export interface TrackPerformanceRecord {
  color: string | null;
  rating: number;
  playCount: number;
  lastPlayedAt: string | null;
  bpmLock: boolean;
  gridLock: boolean;
  mainCueSecond: number | null;
  hotCues: TrackCuePoint[];
  memoryCues: TrackCuePoint[];
  savedLoops: TrackSavedLoop[];
}

export interface BaseTrackPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveBaseTrackPlaylistInput {
  id?: string;
  name: string;
  trackIds: string[];
}

export interface LibraryTrack {
  id: string;
  file: TrackFileRecord;
  tags: TrackTagsRecord;
  analysis: TrackAnalysisRecord;
  performance: TrackPerformanceRecord;
  title: string;
  sourcePath: string;
  storagePath: string | null;
  importedAt: string;
  bpm: number | null;
  bpmConfidence: number;
  durationSeconds: number | null;
  waveformBins: number[];
  beatGrid: BeatGridPoint[];
  bpmCurve: BpmCurvePoint[];
  analyzerStatus: string;
  repoSuggestedBpm: number | null;
  repoSuggestedStatus: string;
  notes: string[];
  fileExtension: string;
  analysisMode: string;
  musicStyleId: string;
  musicStyleLabel: string;
  keySignature: string | null;
  energyLevel: number | null;
  danceability: number | null;
  structuralPatterns: TrackStructuralPattern[];
  visualization?: AssetVisualization;
}

export interface ImportTrackInput {
  title: string;
  sourcePath: string;
  musicStyleId: string;
}

export interface UpdateTrackPerformanceInput {
  rating?: number;
  color?: string | null;
  bpmLock?: boolean;
  gridLock?: boolean;
  markPlayed?: boolean;
  mainCueSecond?: number | null;
  hotCues?: TrackCuePoint[];
  memoryCues?: TrackCuePoint[];
  savedLoops?: TrackSavedLoop[];
}

export interface UpdateTrackAnalysisInput {
  bpm?: number | null;
  beatGrid?: BeatGridPoint[];
  bpmCurve?: BpmCurvePoint[];
}

export interface UpdateTrackSourceInput {
  sourcePath: string;
}

export interface RelinkMissingTracksResult {
  relinkedTracks: LibraryTrack[];
  unresolvedTrackIds: string[];
}
