import { useNotify } from "../components/NotificationSystem";
import { useAppCatalogActions } from "../hooks/useAppCatalogActions";
import { useAppContentNavigationActions } from "../hooks/useAppContentNavigationActions";
import { useAppMonitorActions } from "../hooks/useAppMonitorActions";
import { useAppSelectionActions } from "../hooks/useAppSelectionActions";
import type { AppContentActionBundles, AppContentDomainState } from "./appContentControllerTypes";

export function useAppContentActionBundles(input: AppContentDomainState): AppContentActionBundles {
  const { notify } = useNotify();
  const {
    shellState,
    t,
    userMode,
    library,
    repositories,
    baseAssets,
    compositions,
    sessions,
    monitor,
  } = input;

  const monitorActions = useAppMonitorActions({
    t,
    library,
    repositories,
    sessions,
    monitor,
    notify,
    setAnalysisMode: shellState.setAnalysisMode,
    setScreen: shellState.setScreen,
    setPillar: shellState.setPillar,
  });

  const catalogActions = useAppCatalogActions({
    t,
    notify,
    setNewlyImportedId: shellState.setNewlyImportedId,
    setAnalysisMode: shellState.setAnalysisMode,
    setScreen: shellState.setScreen,
    library,
    repositories,
    baseAssets,
    compositions,
  });

  const selectionActions = useAppSelectionActions({
    armPlaylistBase: monitorActions.armPlaylistBase,
    armTrackBase: monitorActions.armTrackBase,
    library,
    repositories,
    baseAssets,
    compositions,
    setAnalysisMode: shellState.setAnalysisMode,
    setPillar: shellState.setPillar,
    setScreen: shellState.setScreen,
  });

  const navigationActions = useAppContentNavigationActions({
    userMode,
    notify,
    t,
    setPillar: shellState.setPillar,
    setScreen: shellState.setScreen,
    setLibraryTab: shellState.setLibraryTab,
  });

  return {
    notify,
    monitorActions,
    catalogActions,
    selectionActions,
    navigationActions,
  };
}
