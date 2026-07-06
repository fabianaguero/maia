import type { AppTranslations } from "../../i18n/types";
import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import type { InspectScreenContextBarProps, InspectScreenRenderKind } from "./inspectScreenRuntime";

export interface InspectScreenProps {
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onChangeMode: (mode: AnalyzerViewMode) => void;
  onSelectTrack: (id: string) => void;
  onSelectRepository: (id: string) => void;
  onSelectBaseAsset: (id: string) => void;
  onGoLibrary: () => void;
  onGoCompose: () => void;
  onUpdateTrackPerformance: (trackId: string, input: UpdateTrackPerformanceInput) => Promise<void>;
  onUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
  trackMutating: boolean;
}

export function buildInspectScreenRenderStateInput(
  input: Pick<
    InspectScreenProps,
    | "mode"
    | "track"
    | "repository"
    | "baseAsset"
    | "availableTracks"
    | "availableRepositories"
    | "availableBaseAssets"
  >,
) {
  return input;
}

export function buildInspectScreenContextBarInput(
  input: Pick<
    InspectScreenProps,
    | "mode"
    | "track"
    | "repository"
    | "baseAsset"
    | "availableTracks"
    | "availableRepositories"
    | "availableBaseAssets"
  > & { t: AppTranslations },
) {
  return input;
}

export function buildInspectScreenContextBarElementInput(input: {
  contextBarProps: InspectScreenContextBarProps;
  onChangeMode: InspectScreenProps["onChangeMode"];
  onSelectTrack: InspectScreenProps["onSelectTrack"];
  onSelectRepository: InspectScreenProps["onSelectRepository"];
  onSelectBaseAsset: InspectScreenProps["onSelectBaseAsset"];
}) {
  return input;
}

export function resolveInspectScreenPlaceholderTitle(input: {
  kind: InspectScreenRenderKind;
  t: AppTranslations;
}) {
  if (input.kind === "track-placeholder") {
    return input.t.inspect.noTrackSelected;
  }
  if (input.kind === "repo-placeholder") {
    return input.t.inspect.noRepoSelected;
  }
  return input.t.inspect.noBaseAssetSelected;
}

export function buildInspectScreenTrackViewInput(input: {
  track: LibraryTrack;
  analyzerLabel: string;
  trackMutating: boolean;
  contextBar: React.ReactNode;
  onGoCompose: InspectScreenProps["onGoCompose"];
  onUpdateTrackPerformance: InspectScreenProps["onUpdateTrackPerformance"];
  onUpdateTrackAnalysis: InspectScreenProps["onUpdateTrackAnalysis"];
}) {
  return input;
}

export function buildInspectScreenRepositoryViewInput(input: {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  preferredBaseAssetId: string | null;
  analyzerLabel: string;
  contextBar: React.ReactNode;
  onGoCompose: InspectScreenProps["onGoCompose"];
}) {
  return input;
}

export function buildInspectScreenBaseAssetViewInput(input: {
  baseAsset: BaseAssetRecord;
  analyzerLabel: string;
  contextBar: React.ReactNode;
  onGoCompose: InspectScreenProps["onGoCompose"];
}) {
  return input;
}
