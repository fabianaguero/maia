import { useCallback } from "react";

import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseAssetRecord,
  RepositoryAnalysis,
} from "../types/library";

interface UseAppSelectionActionsInput {
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

export function useAppSelectionActions({
  armPlaylistBase,
  armTrackBase,
  library,
  repositories,
  baseAssets,
  compositions,
  setAnalysisMode,
  setPillar,
  setScreen,
}: UseAppSelectionActionsInput) {
  const selectSimpleTrack = useCallback(
    (trackId: string | null) => {
      library.setSelectedTrackId(trackId);
    },
    [library],
  );

  const selectSimpleRepository = useCallback(
    (repositoryId: string | null) => {
      repositories.setSelectedRepositoryId(repositoryId);
    },
    [repositories],
  );

  const selectTrack = useCallback(
    (trackId: string | null) => {
      armTrackBase(trackId);
      setAnalysisMode("track");
    },
    [armTrackBase, setAnalysisMode],
  );

  const selectRepository = useCallback(
    (repositoryId: string | null) => {
      repositories.setSelectedRepositoryId(repositoryId);
      setAnalysisMode("repo");
    },
    [repositories, setAnalysisMode],
  );

  const selectBaseAsset = useCallback(
    (baseAssetId: string | null) => {
      baseAssets.setSelectedBaseAssetId(baseAssetId);
      setAnalysisMode("base");
    },
    [baseAssets, setAnalysisMode],
  );

  const selectComposition = useCallback(
    (compositionId: string | null) => {
      compositions.setSelectedCompositionId(compositionId);
    },
    [compositions],
  );

  const inspectTrack = useCallback(
    (trackId: string | null) => {
      armTrackBase(trackId);
      setAnalysisMode("track");
      setScreen("inspect");
    },
    [armTrackBase, setAnalysisMode, setScreen],
  );

  const inspectRepository = useCallback(
    (repositoryId: string | null) => {
      repositories.setSelectedRepositoryId(repositoryId);
      setAnalysisMode("repo");
      setScreen("inspect");
    },
    [repositories, setAnalysisMode, setScreen],
  );

  const inspectBaseAsset = useCallback(
    (baseAssetId: string | null) => {
      baseAssets.setSelectedBaseAssetId(baseAssetId);
      setAnalysisMode("base");
      setScreen("inspect");
    },
    [baseAssets, setAnalysisMode, setScreen],
  );

  const inspectComposition = useCallback(
    (compositionId: string | null) => {
      compositions.setSelectedCompositionId(compositionId);
      setScreen("compose");
    },
    [compositions, setScreen],
  );

  const goLibrary = useCallback(() => {
    setScreen("library");
  }, [setScreen]);

  const goCompose = useCallback(() => {
    setScreen("compose");
  }, [setScreen]);

  const startSimpleMonitoring = useCallback(
    (repoId: string, trackId?: string | null) => {
      const repo = repositories.repositories.find((entry) => entry.id === repoId);
      if (!repo) {
        return;
      }

      library.setSelectedTrackId(trackId ?? null);
      setPillar("perform");
      setScreen("session");
    },
    [library, repositories.repositories, setPillar, setScreen],
  );

  const startSimpleWizardSession = useCallback(
    (repoId: string, presetId: string) => {
      const repo = repositories.repositories.find((entry) => entry.id === repoId);
      const preset = baseAssets.baseAssets.find((entry) => entry.id === presetId);
      if (!repo || !preset) {
        return;
      }

      setPillar("perform");
      setScreen("session");
    },
    [baseAssets.baseAssets, repositories.repositories, setPillar, setScreen],
  );

  return {
    selectSimpleTrack,
    selectSimpleRepository,
    selectTrack,
    selectPlaylist: armPlaylistBase,
    selectRepository,
    selectBaseAsset,
    selectComposition,
    inspectTrack,
    inspectRepository,
    inspectBaseAsset,
    inspectComposition,
    goLibrary,
    goCompose,
    startSimpleMonitoring,
    startSimpleWizardSession,
  };
}
