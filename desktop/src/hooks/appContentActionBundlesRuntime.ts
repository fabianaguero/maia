import type { useNotify } from "../components/NotificationSystem";
import type { useAppCatalogActions } from "./useAppCatalogActions";
import type { useAppContentNavigationActions } from "./useAppContentNavigationActions";
import type { useAppMonitorActions } from "./useAppMonitorActions";
import type { useAppSelectionActions } from "./useAppSelectionActions";
import type { AppContentActionBundles, AppContentDomainState } from "./appContentControllerTypes";

type NotifyFn = ReturnType<typeof useNotify>["notify"];

export interface AppContentShellActionSetters {
  setNewlyImportedId: AppContentDomainState["shellState"]["setNewlyImportedId"];
  setAnalysisMode: AppContentDomainState["shellState"]["setAnalysisMode"];
  setScreen: AppContentDomainState["shellState"]["setScreen"];
  setPillar: AppContentDomainState["shellState"]["setPillar"];
  setLibraryTab: AppContentDomainState["shellState"]["setLibraryTab"];
}

export interface AppContentActionBundleInputs {
  monitorInput: ReturnType<typeof buildAppContentMonitorActionsInput>;
  catalogInput: ReturnType<typeof buildAppContentCatalogActionsInput>;
  navigationInput: ReturnType<typeof buildAppContentNavigationActionsInput>;
}

export function buildAppContentShellActionSetters(
  input: AppContentDomainState,
): AppContentShellActionSetters {
  return {
    setNewlyImportedId: input.shellState.setNewlyImportedId,
    setAnalysisMode: input.shellState.setAnalysisMode,
    setScreen: input.shellState.setScreen,
    setPillar: input.shellState.setPillar,
    setLibraryTab: input.shellState.setLibraryTab,
  };
}

export function buildAppContentMonitorActionsInput(input: AppContentDomainState, notify: NotifyFn) {
  const shell = buildAppContentShellActionSetters(input);
  return {
    t: input.t,
    library: input.library,
    repositories: input.repositories,
    sessions: input.sessions,
    monitor: input.monitor,
    notify,
    setAnalysisMode: shell.setAnalysisMode,
    setScreen: shell.setScreen,
    setPillar: shell.setPillar,
  };
}

export function buildAppContentCatalogActionsInput(input: AppContentDomainState, notify: NotifyFn) {
  const shell = buildAppContentShellActionSetters(input);
  return {
    t: input.t,
    notify,
    setNewlyImportedId: shell.setNewlyImportedId,
    setAnalysisMode: shell.setAnalysisMode,
    setScreen: shell.setScreen,
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
  const shell = buildAppContentShellActionSetters(input);
  return {
    armPlaylistBase: monitorActions.armPlaylistBase,
    armTrackBase: monitorActions.armTrackBase,
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    compositions: input.compositions,
    setAnalysisMode: shell.setAnalysisMode,
    setPillar: shell.setPillar,
    setScreen: shell.setScreen,
  };
}

export function buildAppContentNavigationActionsInput(
  input: AppContentDomainState,
  notify: NotifyFn,
) {
  const shell = buildAppContentShellActionSetters(input);
  return {
    userMode: input.userMode,
    notify,
    t: input.t,
    setPillar: shell.setPillar,
    setScreen: shell.setScreen,
    setLibraryTab: shell.setLibraryTab,
  };
}

export function buildAppContentActionBundleInputs(
  input: AppContentDomainState,
  notify: NotifyFn,
): AppContentActionBundleInputs {
  return {
    monitorInput: buildAppContentMonitorActionsInput(input, notify),
    catalogInput: buildAppContentCatalogActionsInput(input, notify),
    navigationInput: buildAppContentNavigationActionsInput(input, notify),
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
