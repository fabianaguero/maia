import type { AppTranslations } from "../../i18n/en";
import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { getTrackTitle } from "../../utils/track";

export type InspectScreenRenderKind =
  | "empty"
  | "track-placeholder"
  | "track"
  | "repo-placeholder"
  | "repo"
  | "base-placeholder"
  | "base";

export interface InspectScreenContextBarProps {
  mode: AnalyzerViewMode;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  selectedTrackId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  trackOptions: Array<{ id: string; label: string }>;
  repositoryOptions: Array<{ id: string; label: string }>;
  baseAssetOptions: Array<{ id: string; label: string }>;
  labels: {
    tracks: string;
    logSources: string;
    bases: string;
  };
}

export function buildInspectScreenContextBarProps(input: {
  mode: AnalyzerViewMode;
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
  t: AppTranslations;
}): InspectScreenContextBarProps {
  return {
    mode: input.mode,
    trackCount: input.availableTracks.length,
    repositoryCount: input.availableRepositories.length,
    baseAssetCount: input.availableBaseAssets.length,
    selectedTrackId: input.track?.id ?? null,
    selectedRepositoryId: input.repository?.id ?? null,
    selectedBaseAssetId: input.baseAsset?.id ?? null,
    trackOptions: input.availableTracks.map((entry) => ({
      id: entry.id,
      label: getTrackTitle(entry),
    })),
    repositoryOptions: input.availableRepositories.map((entry) => ({
      id: entry.id,
      label: entry.title,
    })),
    baseAssetOptions: input.availableBaseAssets.map((entry) => ({
      id: entry.id,
      label: entry.title,
    })),
    labels: {
      tracks: input.t.sidebar.tracks,
      logSources: input.t.library.logSources,
      bases: input.t.sidebar.bases,
    },
  };
}

export function buildInspectScreenRenderState(input: {
  mode: AnalyzerViewMode;
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
}): {
  hasAnyAsset: boolean;
  kind: InspectScreenRenderKind;
} {
  const hasAnyAsset =
    input.availableTracks.length > 0 ||
    input.availableRepositories.length > 0 ||
    input.availableBaseAssets.length > 0;

  if (!hasAnyAsset) {
    return {
      hasAnyAsset,
      kind: "empty",
    };
  }

  if (input.mode === "track") {
    return {
      hasAnyAsset,
      kind: input.track ? "track" : "track-placeholder",
    };
  }

  if (input.mode === "repo") {
    return {
      hasAnyAsset,
      kind: input.repository ? "repo" : "repo-placeholder",
    };
  }

  return {
    hasAnyAsset,
    kind: input.baseAsset ? "base" : "base-placeholder",
  };
}
