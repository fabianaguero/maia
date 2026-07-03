import { useAppSelectionEntityActions } from "./useAppSelectionEntityActions";
import { useAppSelectionMonitorActions } from "./useAppSelectionMonitorActions";
import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

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
  const entityActions = useAppSelectionEntityActions({
    armPlaylistBase,
    armTrackBase,
    library,
    repositories,
    baseAssets,
    compositions,
    setAnalysisMode,
    setScreen,
  });
  const monitorActions = useAppSelectionMonitorActions({
    library,
    repositories,
    baseAssets,
    setPillar,
    setScreen,
  });

  return {
    ...entityActions,
    ...monitorActions,
  };
}
