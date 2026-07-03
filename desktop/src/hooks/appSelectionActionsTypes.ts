import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseAssetRecord,
  RepositoryAnalysis,
} from "../types/library";

export interface UseAppSelectionActionsInput {
  armPlaylistBase: (playlistId: string | null | undefined) => void;
  armTrackBase: (trackId: string | null | undefined) => void;
  library: {
    setSelectedTrackId: (trackId: string | null) => void;
  };
  repositories: {
    repositories: RepositoryAnalysis[];
    setSelectedRepositoryId: (repositoryId: string | null) => void;
  };
  baseAssets: {
    baseAssets: BaseAssetRecord[];
    setSelectedBaseAssetId: (baseAssetId: string | null) => void;
  };
  compositions: {
    setSelectedCompositionId: (compositionId: string | null) => void;
  };
  setAnalysisMode: (mode: AnalyzerViewMode) => void;
  setPillar: (pillar: AppPillar) => void;
  setScreen: (screen: AppScreen) => void;
}
