export type AppScreen = "library" | "analyzer";
export type AnalyzerViewMode = "track" | "repo" | "base" | "composition";

export interface BeatGridPoint {
  index: number;
  second: number;
}

export interface BpmCurvePoint {
  second: number;
  bpm: number;
}

export interface LibraryTrack {
  id: string;
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
}

export interface ImportTrackInput {
  title: string;
  sourcePath: string;
  musicStyleId: string;
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

export type CompositionReferenceType = "track" | "repo" | "manual";

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
}

export interface ImportCompositionInput {
  baseAssetId: string;
  referenceType: CompositionReferenceType;
  referenceAssetId?: string;
  manualBpm?: number;
  label?: string;
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

export type StreamAdapterKind = "file" | "process";

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
