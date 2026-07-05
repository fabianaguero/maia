import type { useAppSelectionEntityActions } from "./useAppSelectionEntityActions";
import type { useAppSelectionMonitorActions } from "./useAppSelectionMonitorActions";
import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

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

export function buildAppSelectionActionsResult(input: {
  entityActions: ReturnType<typeof useAppSelectionEntityActions>;
  monitorActions: ReturnType<typeof useAppSelectionMonitorActions>;
}) {
  return {
    ...input.entityActions,
    ...input.monitorActions,
  };
}
