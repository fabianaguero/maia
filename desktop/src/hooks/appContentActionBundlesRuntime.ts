import type { useNotify } from "../components/NotificationSystem";
import type { useAppCatalogActions } from "./useAppCatalogActions";
import type { useAppContentNavigationActions } from "./useAppContentNavigationActions";
import type { useAppMonitorActions } from "./useAppMonitorActions";
import type { useAppSelectionActions } from "./useAppSelectionActions";
import type { AppContentActionBundles, AppContentDomainState } from "./appContentControllerTypes";

type NotifyFn = ReturnType<typeof useNotify>["notify"];

export function buildAppContentMonitorActionsInput(input: AppContentDomainState, notify: NotifyFn) {
  return {
    t: input.t,
    library: input.library,
    repositories: input.repositories,
    sessions: input.sessions,
    monitor: input.monitor,
    notify,
    setAnalysisMode: input.shellState.setAnalysisMode,
    setScreen: input.shellState.setScreen,
    setPillar: input.shellState.setPillar,
  };
}

export function buildAppContentCatalogActionsInput(input: AppContentDomainState, notify: NotifyFn) {
  return {
    t: input.t,
    notify,
    setNewlyImportedId: input.shellState.setNewlyImportedId,
    setAnalysisMode: input.shellState.setAnalysisMode,
    setScreen: input.shellState.setScreen,
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    compositions: input.compositions,
  };
}

export function buildAppContentSelectionActionsInput(
  input: AppContentDomainState,
  monitorActions: Pick<ReturnType<typeof useAppMonitorActions>, "armPlaylistBase" | "armTrackBase">,
) {
  return {
    armPlaylistBase: monitorActions.armPlaylistBase,
    armTrackBase: monitorActions.armTrackBase,
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    compositions: input.compositions,
    setAnalysisMode: input.shellState.setAnalysisMode,
    setPillar: input.shellState.setPillar,
    setScreen: input.shellState.setScreen,
  };
}

export function buildAppContentNavigationActionsInput(
  input: AppContentDomainState,
  notify: NotifyFn,
) {
  return {
    userMode: input.userMode,
    notify,
    t: input.t,
    setPillar: input.shellState.setPillar,
    setScreen: input.shellState.setScreen,
    setLibraryTab: input.shellState.setLibraryTab,
  };
}

export function buildAppContentActionBundlesResult(input: {
  notify: NotifyFn;
  monitorActions: ReturnType<typeof useAppMonitorActions>;
  catalogActions: ReturnType<typeof useAppCatalogActions>;
  selectionActions: ReturnType<typeof useAppSelectionActions>;
  navigationActions: ReturnType<typeof useAppContentNavigationActions>;
}): AppContentActionBundles {
  return input;
}
