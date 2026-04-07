import type { BaseAssetCategoryOption } from "./types/baseAsset";
import type { MusicStyleOption } from "./types/music";

export const CONTRACT_VERSION = "1.0";

export type MusicalAssetType =
  | "track_analysis"
  | "repo_analysis"
  | "base_asset"
  | "composition_result";

export type AnalyzerAction = "health" | "analyze";
export type SourceKind = "file" | "directory" | "url";

export interface SourceRef {
  kind: SourceKind;
  path: string;
  label?: string;
}

export interface AnalyzeOptions {
  waveformBins?: number;
  beatGridResolution?: number;
  captureBpmCurve?: boolean;
  inferCodeSuggestedBpm?: boolean;
  logTailChunk?: string;
  logTailFromOffset?: number;
  logTailToOffset?: number;
  logTailLiveMode?: boolean;
  baseAssetCategory?: string;
  baseAssetReusable?: boolean;
  compositionBaseAssetEntryCount?: number;
  compositionReferenceType?: "track" | "repo" | "manual";
  compositionReferenceLabel?: string;
  compositionReferenceBpm?: number;
  compositionPreviewOutputPath?: string;
}

export interface HealthRequest {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  action: "health";
  payload: Record<string, never>;
}

export interface AnalyzeRequest {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  action: "analyze";
  payload: {
    assetType: MusicalAssetType;
    source: SourceRef;
    options?: AnalyzeOptions;
  };
}

export type AnalyzerRequest = HealthRequest | AnalyzeRequest;

export interface MusicalAsset {
  id: string;
  assetType: MusicalAssetType;
  title: string;
  sourcePath: string;
  suggestedBpm: number | null;
  confidence: number;
  tags: string[];
  metrics: Record<string, unknown>;
  artifacts: {
    waveformBins: number[];
    beatGrid: Array<{
      index: number;
      second: number;
    }>;
    bpmCurve: Array<{
      second: number;
      bpm: number;
    }>;
  };
  visualization?: {
    waveform: number[];
    hotCues: Array<{
      second: number;
      label: string;
      type: string;
      excerpt?: string;
    }>;
    beatGrid: Array<{
      index: number;
      second: number;
    }>;
    complexityCurve?: number[];
  };
  createdAt: string;
}

export interface HealthResponse {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  status: "ok";
  payload: {
    analyzerVersion: string;
    runtime: string;
    supportedActions: AnalyzerAction[];
    modes: string[];
    supportedTrackFormats?: string[];
  };
  warnings: string[];
}

export interface AnalysisSuccessResponse {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  status: "ok";
  payload: {
    summary: string;
    musicalAsset: MusicalAsset;
  };
  warnings: string[];
}

export interface ErrorResponse {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  status: "error";
  error: {
    code: string;
    message: string;
  };
  warnings: string[];
}

export type AnalyzerResponse =
  | HealthResponse
  | AnalysisSuccessResponse
  | ErrorResponse;

export interface BootstrapManifest {
  appName: string;
  contractVersion: string;
  repoRoot: string;
  analyzerEntrypoint: string;
  contractsDir: string;
  databaseSchema: string;
  databasePath: string;
  persistenceMode: string;
  docsDir: string;
  runtimeMode: string;
  musicStyleConfigPath: string;
  defaultTrackMusicStyleId: string;
  musicStyles: MusicStyleOption[];
  baseAssetCategoryConfigPath: string;
  defaultBaseAssetCategoryId: string;
  baseAssetCategories: BaseAssetCategoryOption[];
}

function createRequestId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

export function createHealthRequest(): HealthRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: createRequestId("health"),
    action: "health",
    payload: {},
  };
}

export function createAnalyzeTrackRequest(sourcePath: string): AnalyzeRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: createRequestId("track"),
    action: "analyze",
    payload: {
      assetType: "track_analysis",
      source: {
        kind: "file",
        path: sourcePath,
      },
      options: {
        waveformBins: 256,
        beatGridResolution: 1,
        captureBpmCurve: true,
      },
    },
  };
}

export function createAnalyzeRepositoryRequest(sourceKind: string, sourcePath: string): AnalyzeRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: createRequestId("repo"),
    action: "analyze",
    payload: {
      assetType: "repo_analysis",
      source: {
        kind: sourceKind as SourceKind,
        path: sourcePath,
      },
      options: {
        inferCodeSuggestedBpm: true,
      },
    },
  };
}

export function createRepoAnalysisRequest(source: SourceRef): AnalyzeRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: createRequestId("repo"),
    action: "analyze",
    payload: {
      assetType: "repo_analysis",
      source,
      options: {
        inferCodeSuggestedBpm: true,
      },
    },
  };
}
