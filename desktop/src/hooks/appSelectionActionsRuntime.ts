import type { useAppSelectionEntityActions } from "./useAppSelectionEntityActions";
import type { useAppSelectionMonitorActions } from "./useAppSelectionMonitorActions";
import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

export interface AppSelectionEntityActionRunners {
  selectSimpleTrack: (trackId: string | null) => void;
  selectSimpleRepository: (repositoryId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  selectPlaylist: (playlistId: string | null | undefined) => void;
  selectRepository: (repositoryId: string | null) => void;
  selectBaseAsset: (baseAssetId: string | null) => void;
  selectComposition: (compositionId: string | null) => void;
  inspectTrack: (trackId: string | null) => void;
  inspectRepository: (repositoryId: string | null) => void;
  inspectBaseAsset: (baseAssetId: string | null) => void;
  inspectComposition: (compositionId: string | null) => void;
}

export interface AppSelectionMonitorActionRunners {
  goLibrary: () => void;
  goCompose: () => void;
  startSimpleMonitoring: (repoId: string, trackId?: string | null) => void;
  startSimpleWizardSession: (repoId: string, presetId: string) => void;
}

export function selectAppTrack(
  armTrackBase: UseAppSelectionActionsInput["armTrackBase"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  trackId: string | null,
): void {
  armTrackBase(trackId);
  setAnalysisMode("track");
}

export function selectAppRepository(
  repositories: UseAppSelectionActionsInput["repositories"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  repositoryId: string | null,
): void {
  repositories.setSelectedRepositoryId(repositoryId);
  setAnalysisMode("repo");
}

export function selectAppBaseAsset(
  baseAssets: UseAppSelectionActionsInput["baseAssets"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  baseAssetId: string | null,
): void {
  baseAssets.setSelectedBaseAssetId(baseAssetId);
  setAnalysisMode("base");
}

export function inspectAppTrack(
  armTrackBase: UseAppSelectionActionsInput["armTrackBase"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  setScreen: UseAppSelectionActionsInput["setScreen"],
  trackId: string | null,
): void {
  selectAppTrack(armTrackBase, setAnalysisMode, trackId);
  setScreen("inspect");
}

export function inspectAppRepository(
  repositories: UseAppSelectionActionsInput["repositories"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  setScreen: UseAppSelectionActionsInput["setScreen"],
  repositoryId: string | null,
): void {
  selectAppRepository(repositories, setAnalysisMode, repositoryId);
  setScreen("inspect");
}

export function inspectAppBaseAsset(
  baseAssets: UseAppSelectionActionsInput["baseAssets"],
  setAnalysisMode: UseAppSelectionActionsInput["setAnalysisMode"],
  setScreen: UseAppSelectionActionsInput["setScreen"],
  baseAssetId: string | null,
): void {
  selectAppBaseAsset(baseAssets, setAnalysisMode, baseAssetId);
  setScreen("inspect");
}

export function repositoryExists(
  repositories: UseAppSelectionActionsInput["repositories"]["repositories"],
  repoId: string,
): boolean {
  return repositories.some((entry) => entry.id === repoId);
}

export function presetExists(
  baseAssets: UseAppSelectionActionsInput["baseAssets"]["baseAssets"],
  presetId: string,
): boolean {
  return baseAssets.some((entry) => entry.id === presetId);
}

export function buildAppSelectionEntityActionsInput(input: UseAppSelectionActionsInput) {
  return {
    armPlaylistBase: input.armPlaylistBase,
    armTrackBase: input.armTrackBase,
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    compositions: input.compositions,
    setAnalysisMode: input.setAnalysisMode,
    setScreen: input.setScreen,
  };
}

export function buildAppSelectionMonitorActionsInput(input: UseAppSelectionActionsInput) {
  return {
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    setPillar: input.setPillar,
    setScreen: input.setScreen,
  };
}

export function buildAppSelectionEntityActionRunners(
  input: ReturnType<typeof buildAppSelectionEntityActionsInput>,
): AppSelectionEntityActionRunners {
  return {
    selectSimpleTrack: (trackId) => {
      input.library.setSelectedTrackId(trackId);
    },
    selectSimpleRepository: (repositoryId) => {
      input.repositories.setSelectedRepositoryId(repositoryId);
    },
    selectTrack: (trackId) => {
      selectAppTrack(input.armTrackBase, input.setAnalysisMode, trackId);
    },
    selectPlaylist: input.armPlaylistBase,
    selectRepository: (repositoryId) => {
      selectAppRepository(input.repositories, input.setAnalysisMode, repositoryId);
    },
    selectBaseAsset: (baseAssetId) => {
      selectAppBaseAsset(input.baseAssets, input.setAnalysisMode, baseAssetId);
    },
    selectComposition: (compositionId) => {
      input.compositions.setSelectedCompositionId(compositionId);
    },
    inspectTrack: (trackId) => {
      inspectAppTrack(input.armTrackBase, input.setAnalysisMode, input.setScreen, trackId);
    },
    inspectRepository: (repositoryId) => {
      inspectAppRepository(
        input.repositories,
        input.setAnalysisMode,
        input.setScreen,
        repositoryId,
      );
    },
    inspectBaseAsset: (baseAssetId) => {
      inspectAppBaseAsset(input.baseAssets, input.setAnalysisMode, input.setScreen, baseAssetId);
    },
    inspectComposition: (compositionId) => {
      input.compositions.setSelectedCompositionId(compositionId);
      input.setScreen("compose");
    },
  };
}

export function buildAppSelectionMonitorActionRunners(
  input: ReturnType<typeof buildAppSelectionMonitorActionsInput>,
): AppSelectionMonitorActionRunners {
  return {
    goLibrary: () => {
      input.setScreen("library");
    },
    goCompose: () => {
      input.setScreen("compose");
    },
    startSimpleMonitoring: (repoId, trackId) => {
      if (!repositoryExists(input.repositories.repositories, repoId)) {
        return;
      }

      input.library.setSelectedTrackId(trackId ?? null);
      input.setPillar("perform");
      input.setScreen("session");
    },
    startSimpleWizardSession: (repoId, presetId) => {
      if (
        !repositoryExists(input.repositories.repositories, repoId) ||
        !presetExists(input.baseAssets.baseAssets, presetId)
      ) {
        return;
      }

      input.setPillar("perform");
      input.setScreen("session");
    },
  };
}

export function buildAppSelectionActionsResult(input: {
  entityActions: ReturnType<typeof useAppSelectionEntityActions>;
  monitorActions: ReturnType<typeof useAppSelectionMonitorActions>;
}) {
  return {
    ...input.entityActions,
    ...input.monitorActions,
  };
}
