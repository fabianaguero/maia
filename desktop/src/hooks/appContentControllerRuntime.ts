import type { AppPillar, AppScreen } from "../types/library";
import type {
  AppContentControllerActionBundles,
  AppContentDomainState,
} from "./appContentControllerTypes";

export function buildAppContentStatusInput(domainState: AppContentDomainState) {
  return {
    analysisMode: domainState.shellState.analysisMode,
    baseAsset: domainState.baseAssets.selectedBaseAsset,
    booting: domainState.booting,
    composition: domainState.compositions.selectedComposition,
    health: domainState.health,
    playlistName: domainState.library.selectedPlaylist?.name ?? null,
    repository: domainState.repositories.selectedRepository,
    screen: domainState.shellState.screen,
    track: domainState.library.selectedTrack,
  };
}

export function buildAppContentMutationInput(domainState: AppContentDomainState) {
  return {
    baseAssetsMutating: domainState.baseAssets.mutating,
    compositionsMutating: domainState.compositions.mutating,
    libraryMutating: domainState.library.mutating,
    repositoriesMutating: domainState.repositories.mutating,
  };
}

export function buildAppContentSessionEffectsInput(domainState: AppContentDomainState) {
  return {
    screen: domainState.shellState.screen,
    refreshSessionBookmarks: domainState.sessions.refreshBookmarks,
  };
}

export function buildAppContentControllerValue(input: {
  domainState: AppContentDomainState;
  actionBundles: AppContentControllerActionBundles;
  effectivePillar: AppPillar;
  effectiveScreen: AppScreen;
  analyzerLabel: string;
  detailDeckLabel: string;
  screenLabel: string;
  selectedItemTitle: string | null;
  isMutating: boolean;
  mutateLabel: string;
}) {
  const {
    domainState,
    actionBundles,
    effectivePillar,
    effectiveScreen,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  } = input;
  const { shellState } = domainState;

  return {
    t: domainState.t,
    userMode: domainState.userMode,
    isTransitioning: domainState.isTransitioning,
    manifest: domainState.manifest,
    health: domainState.health,
    booting: domainState.booting,
    screen: shellState.screen,
    pillar: shellState.pillar,
    libraryTab: shellState.libraryTab,
    analysisMode: shellState.analysisMode,
    isDark: shellState.isDark,
    lang: shellState.lang,
    newlyImportedId: shellState.newlyImportedId,
    library: domainState.library,
    repositories: domainState.repositories,
    baseAssets: domainState.baseAssets,
    compositions: domainState.compositions,
    monitor: domainState.monitor,
    sessions: domainState.sessions,
    effectivePillar,
    effectiveScreen,
    ...actionBundles.catalogActions,
    ...actionBundles.selectionActions,
    startReplaySession: actionBundles.monitorActions.startReplaySession,
    startLiveSession: actionBundles.monitorActions.startLiveSession,
    openMonitoredRepo: actionBundles.monitorActions.openMonitoredRepo,
    ...actionBundles.navigationActions,
    setLang: shellState.setLang,
    setIsDark: shellState.setIsDark,
    setLibraryTab: shellState.setLibraryTab,
    setAnalysisMode: shellState.setAnalysisMode,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  };
}
