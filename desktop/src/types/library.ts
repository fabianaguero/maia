export type AppScreen = "library" | "analyzer";
export type AnalyzerViewMode = "track" | "repo" | "base";

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

export type RepositorySourceKind = "directory" | "url";

export interface RepositoryAnalysis {
  id: string;
  title: string;
  sourcePath: string;
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

export interface ImportRepositoryInput {
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  label?: string;
}
