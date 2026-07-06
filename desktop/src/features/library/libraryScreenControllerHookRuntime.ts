import type { AppTranslations } from "../../i18n/types";
import type { LibraryScreenControllerInput } from "./libraryScreenControllerTypes";
import type { LibraryScreenViewModel } from "./libraryScreenViewModel";
import type { LibraryTab } from "./libraryScreenTypes";
import type { LibraryToolbarAction } from "./libraryScreenControllerTypes";

export function buildLibraryScreenStateHookInput(
  input: Pick<
    LibraryScreenControllerInput,
    | "activeTab"
    | "onSavePlaylist"
    | "onSelectPlaylist"
    | "onTabChange"
    | "playlists"
    | "selectedPlaylistId"
  >,
) {
  return input;
}

export function buildLibraryScreenImportActionsHookInput(input: {
  onImportTrack: LibraryScreenControllerInput["onImportTrack"];
  onImportRepository: LibraryScreenControllerInput["onImportRepository"];
  onImportBaseAsset: LibraryScreenControllerInput["onImportBaseAsset"];
  refreshLogConnections: () => Promise<void>;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  setLogConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return input;
}

export function buildLibraryScreenViewModelInput(input: {
  activeTab: LibraryTab;
  showForm: boolean;
  tracksCount: number;
  repositoriesCount: number;
  logConnectionsCount: number;
  baseAssetsCount: number;
  missingTrackCount: number;
  trackLoading: boolean;
  repositoryLoading: boolean;
  baseAssetLoading: boolean;
  trackError: string | null;
  repositoryError: string | null;
  logConnectionError: string | null;
  baseAssetError: string | null;
  t: AppTranslations;
}) {
  return {
    activeTab: input.activeTab,
    showForm: input.showForm,
    counts: {
      tracks: input.tracksCount,
      repositories: input.repositoriesCount,
      logConnections: input.logConnectionsCount,
      baseAssets: input.baseAssetsCount,
      missingTracks: input.missingTrackCount,
    },
    loadingState: {
      trackLoading: input.trackLoading,
      repositoryLoading: input.repositoryLoading,
      baseAssetLoading: input.baseAssetLoading,
    },
    errorState: {
      trackError: input.trackError,
      repositoryError: input.repositoryError,
      logConnectionError: input.logConnectionError,
      baseAssetError: input.baseAssetError,
    },
    t: input.t,
  };
}

export function buildLibraryScreenToolbarActionsHookInput(input: {
  t: AppTranslations;
  tab: LibraryTab;
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  viewModel: LibraryScreenViewModel;
  missingTrackCount: number;
  tracks: LibraryScreenControllerInput["tracks"];
  repositories: LibraryScreenControllerInput["repositories"];
  openPlaylistEditor: () => void;
  onSeedDemo: LibraryScreenControllerInput["onSeedDemo"];
  onRelinkMissingTracks: LibraryScreenControllerInput["onRelinkMissingTracks"];
  onDeleteTrack: LibraryScreenControllerInput["onDeleteTrack"];
  onDeleteRepository: LibraryScreenControllerInput["onDeleteRepository"];
}) {
  return input;
}

export function buildLibraryScreenControllerHookResult<
  TState extends {
    t: AppTranslations;
    tab: LibraryTab;
    viewModel: LibraryScreenViewModel;
    toolbarActions: LibraryToolbarAction[];
  },
>(state: TState): TState {
  return state;
}
