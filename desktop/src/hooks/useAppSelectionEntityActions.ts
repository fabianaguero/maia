import { useCallback } from "react";

import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

type EntityActionsInput = Pick<
  UseAppSelectionActionsInput,
  | "armPlaylistBase"
  | "armTrackBase"
  | "library"
  | "repositories"
  | "baseAssets"
  | "compositions"
  | "setAnalysisMode"
  | "setScreen"
>;

export function useAppSelectionEntityActions({
  armPlaylistBase,
  armTrackBase,
  library,
  repositories,
  baseAssets,
  compositions,
  setAnalysisMode,
  setScreen,
}: EntityActionsInput) {
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
  };
}
