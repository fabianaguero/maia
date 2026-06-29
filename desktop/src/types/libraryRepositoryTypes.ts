import type { BeatGridPoint, BpmCurvePoint } from "./libraryTrackTypes";

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

export interface ImportRepositoryInput {
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  label?: string;
}
