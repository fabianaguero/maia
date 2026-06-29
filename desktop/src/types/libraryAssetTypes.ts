import type { AssetVisualization, BeatGridPoint, BpmCurvePoint } from "./libraryTrackTypes";

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
  trackId?: string;
  playlistId?: string;
  structureId?: string;
}
