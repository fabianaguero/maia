export type AppScreen = "library" | "inspect" | "compose" | "session";
export type AnalyzerViewMode = "track" | "repo" | "base";

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
export type TrackPlaybackSource =
  | "managed_snapshot"
  | "source_file"
  | "unavailable";

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

export type BaseAssetSourceKind = "file" | "directory";

export interface BaseAssetRecord {
  id: string;
  title: string;
  sourcePath: string;
  storagePath: string;
  sourceKind: BaseAssetSourceKind;
  importedAt: string;
  categoryId: string;
  categoryLabel: string;
  reusable: boolean;
  entryCount: number;
  checksum: string | null;
  confidence: number;
  summary: string;
  analyzerStatus: string;
  notes: string[];
  tags: string[];
  metrics: Record<string, unknown>;
}

export interface ImportBaseAssetInput {
  sourceKind: BaseAssetSourceKind;
  sourcePath: string;
  label?: string;
  categoryId: string;
  reusable: boolean;
}

export type CompositionReferenceType = "track" | "playlist" | "repo" | "manual";

export interface CompositionResultRecord {
  id: string;
  title: string;
  sourcePath: string;
  exportPath: string | null;
  previewAudioPath: string | null;
  sourceKind: BaseAssetSourceKind;
  importedAt: string;
  baseAssetId: string;
  baseAssetTitle: string;
  baseAssetCategoryId: string;
  baseAssetCategoryLabel: string;
  basePlaylistId?: string | null;
  basePlaylistName?: string | null;
  referenceType: CompositionReferenceType;
  referenceAssetId: string | null;
  referenceTitle: string;
  referenceSourcePath: string | null;
  targetBpm: number;
  confidence: number;
  strategy: string;
  summary: string;
  analyzerStatus: string;
  notes: string[];
  tags: string[];
  metrics: Record<string, unknown>;
  waveformBins: number[];
  beatGrid: BeatGridPoint[];
  bpmCurve: BpmCurvePoint[];
  visualization?: AssetVisualization;
}

export interface ImportCompositionInput {
  baseAssetId: string;
  referenceType: CompositionReferenceType;
  referenceAssetId?: string;
  manualBpm?: number;
  label?: string;
  /** Track ID to use as instrumental/beat base (required) */
  trackId?: string;
  /** Playlist ID to use as the musical base instead of a single track */
  playlistId?: string;
  /** Repository/log ID for structural variation (optional) */
  structureId?: string;
}

export type RepositorySourceKind = "directory" | "file" | "url";

export interface RepositoryAnalysis {
  id: string;
  title: string;
  sourcePath: string;
  storagePath: string | null;
  sourceKind: RepositorySourceKind;
  importedAt: string;
  suggestedBpm: number | null;
  confidence: number;
  summary: string;
  analyzerStatus: string;
  buildSystem: string;
  primaryLanguage: string;
  javaFileCount: number;
  testFileCount: number;
  waveformBins: number[];
  beatGrid: BeatGridPoint[];
  bpmCurve: BpmCurvePoint[];
  notes: string[];
  tags: string[];
  metrics: Record<string, unknown>;
}

export interface LiveLogCue {
  id: string;
  eventIndex: number;
  level: string;
  component: string;
  excerpt: string;
  noteHz: number;
  durationMs: number;
  gain: number;
  waveform: OscillatorType;
  accent: string;
}

export interface LiveLogMarker {
  eventIndex: number;
  level: string;
  component: string;
  excerpt: string;
}

export interface LiveLogComponentCount {
  component: string;
  count: number;
}

export interface LiveLogStreamUpdate {
  sourcePath: string;
  fromOffset: number;
  toOffset: number;
  replayWindowIndex?: number | null;
  hasData: boolean;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCounts: Record<string, number>;
  anomalyMarkers: LiveLogMarker[];
  topComponents: LiveLogComponentCount[];
  sonificationCues: LiveLogCue[];
  warnings: string[];
}

export interface ImportRepositoryInput {
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  label?: string;
}

export type StreamAdapterKind = "file" | "process" | "websocket" | "http-poll" | "journald";

export interface StreamSessionRecord {
  sessionId: string;
  adapterKind: StreamAdapterKind;
  source: string;
  label: string | null;
  createdAt: string;
  lastPolledAt: string | null;
  totalPolls: number;
  fileCursor: number | null;
}

export interface StartSessionInput {
  sessionId: string;
  adapterKind: StreamAdapterKind;
  source: string;
  label?: string;
  command?: string[];
  /** WebSocket URL — required when adapterKind is "websocket" */
  wsUrl?: string;
  /** HTTP endpoint URL — required when adapterKind is "http-poll" */
  httpUrl?: string;
}

export interface StreamSessionPollResult {
  session: StreamSessionRecord;
  hasData: boolean;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCounts: Record<string, number>;
  anomalyMarkers: LiveLogMarker[];
  topComponents: LiveLogComponentCount[];
  sonificationCues: LiveLogCue[];
  warnings: string[];
}
