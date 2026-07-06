import type { AppSectionContentProps } from "./AppSectionContent";
import type { useAppContentController } from "./hooks/useAppContentController";

type AppContentControllerValue = ReturnType<typeof useAppContentController>;
type AppShellUserMode = "simple" | "expert";

export function buildAppShellSpinnerState(input: {
  booting: boolean;
  isMutating: boolean;
  bootingLabel: string;
  mutateLabel: string;
}) {
  return {
    visible: input.booting || input.isMutating,
    label: input.booting ? input.bootingLabel : input.mutateLabel,
  };
}

export function buildAppShellLayoutState(input: {
  pillar: string;
  isTransitioning: boolean;
  userMode: AppShellUserMode;
}) {
  return {
    mainClassName: `app-main role--${input.pillar} ${input.isTransitioning ? "opacity-transition" : ""}`,
    mainKey: `${input.userMode}-${input.pillar}`,
  };
}

export function buildAppTopbarProps(
  controller: AppContentControllerValue,
  userMode: AppShellUserMode,
) {
  return {
    userMode,
    isDark: controller.isDark,
    lang: controller.lang,
    workspaceLabel: controller.t.workspace,
    controls: controller.t.controls,
    onToggleLanguage: () =>
      controller.setLang((current: "en" | "es") => (current === "en" ? "es" : "en")),
    onToggleTheme: () => controller.setIsDark((current: boolean) => !current),
  };
}

export function buildAppMonitorOverviewProps(
  controller: AppContentControllerValue,
  userMode: AppShellUserMode,
) {
  return {
    userMode,
    selectedItemTitle: controller.selectedItemTitle,
    screenLabel: controller.t.appShell.nowPlaying,
    detailDeckLabel: controller.detailDeckLabel,
    liveLabel: controller.t.appShell.live,
    hasMonitorSession: Boolean(controller.monitor.session),
    monitorMetrics: controller.monitor.metrics,
    anomalyLabel: controller.t.simpleMode.monitor.anomalies,
    tracks: controller.library.tracks,
  };
}

export function buildAppSidebarProps(controller: AppContentControllerValue) {
  return {
    currentPillar: controller.effectivePillar,
    onPillarChange: controller.handlePillarChange,
    trackCount: controller.library.tracks.length,
    repositoryCount: controller.repositories.repositories.length,
    baseAssetCount: controller.baseAssets.baseAssets.length,
    compositionCount: controller.compositions.compositions.length,
    selectedItemTitle: controller.selectedItemTitle,
    monitorSession: controller.monitor.session,
    monitorMetrics: controller.monitor.metrics,
    onStopMonitor: () => void controller.monitor.stopSession(),
    onOpenMonitoredRepo: controller.openMonitoredRepo,
    onOpenConnections: controller.handleOpenConnections,
    connectionsActive:
      controller.pillar === "curate" &&
      controller.screen === "library" &&
      controller.libraryTab === "connections",
    onHideToBackground: controller.handleHideToBackground,
  };
}

export function buildAppSectionContentProps(
  controller: AppContentControllerValue,
  userMode: AppShellUserMode,
): AppSectionContentProps {
  return {
    userMode,
    effectivePillar: controller.effectivePillar,
    effectiveScreen: controller.effectiveScreen,
    monitorSession: controller.monitor.session,
    monitorIsPlayback: controller.monitor.isPlayback,
    monitorPlaybackProgress: controller.monitor.playbackProgress,
    manifest: controller.manifest,
    musicStyles: controller.manifest?.musicStyles ?? [],
    baseAssetCategories: controller.manifest?.baseAssetCategories ?? [],
    defaultTrackMusicStyleId: controller.manifest?.defaultTrackMusicStyleId,
    defaultBaseAssetCategoryId: controller.manifest?.defaultBaseAssetCategoryId,
    libraryTab: controller.libraryTab,
    tracks: controller.library.tracks,
    playlists: controller.library.playlists,
    repositories: controller.repositories.repositories,
    baseAssets: controller.baseAssets.baseAssets,
    compositions: controller.compositions.compositions,
    newlyImportedId: controller.newlyImportedId,
    selectedTrack: controller.library.selectedTrack,
    selectedTrackId: controller.library.selectedTrackId,
    selectedPlaylistId: controller.library.selectedPlaylistId,
    selectedRepository: controller.repositories.selectedRepository,
    selectedRepositoryId: controller.repositories.selectedRepositoryId,
    selectedBaseAsset: controller.baseAssets.selectedBaseAsset,
    selectedBaseAssetId: controller.baseAssets.selectedBaseAssetId,
    selectedComposition: controller.compositions.selectedComposition,
    selectedCompositionId: controller.compositions.selectedCompositionId,
    trackLoading: controller.library.loading,
    repositoryLoading: controller.repositories.loading,
    baseAssetLoading: controller.baseAssets.loading,
    compositionLoading: controller.compositions.loading,
    trackBusy: controller.library.mutating,
    repositoryBusy: controller.repositories.mutating,
    baseAssetBusy: controller.baseAssets.mutating,
    compositionBusy: controller.compositions.mutating,
    trackError: controller.library.error,
    repositoryError: controller.repositories.error,
    baseAssetError: controller.baseAssets.error,
    compositionError: controller.compositions.error,
    analysisMode: controller.analysisMode,
    analyzerLabel: controller.analyzerLabel,
    sessionBookmarksBySessionId: controller.sessions.sessionBookmarksBySessionId,
    sessions: controller.sessions.sessions,
    selectedSessionId: controller.sessions.selectedSessionId,
    sessionsLoading: controller.sessions.loading,
    sessionsMutating: controller.sessions.mutating,
    sessionsError: controller.sessions.error,
    onImportTrack: controller.handleImportTrack,
    onImportRepository: controller.handleImportRepository,
    onImportBaseAsset: controller.handleImportBaseAsset,
    onImportComposition: controller.handleImportComposition,
    onReanalyzeTrack: controller.handleReanalyzeTrack,
    onRelinkTrack: controller.handleRelinkTrack,
    onRelinkMissingTracks: controller.handleRelinkMissingTracks,
    onReanalyzeRepository: controller.handleReanalyzeRepository,
    onDeleteTrack: controller.handleDeleteTrack,
    onDeleteRepository: controller.handleDeleteRepository,
    onSeedDemo: controller.library.seedLibrary,
    onSavePlaylist: controller.handleSavePlaylist,
    onDeletePlaylist: controller.handleDeletePlaylist,
    onSelectSimpleTrack: controller.selectSimpleTrack,
    onSelectSimpleRepository: controller.selectSimpleRepository,
    onSelectTrack: controller.selectTrack,
    onSelectPlaylist: controller.selectPlaylist,
    onSelectRepository: controller.selectRepository,
    onSelectBaseAsset: controller.selectBaseAsset,
    onSelectComposition: controller.selectComposition,
    onInspectTrack: controller.inspectTrack,
    onInspectRepository: controller.inspectRepository,
    onInspectBaseAsset: controller.inspectBaseAsset,
    onInspectComposition: controller.inspectComposition,
    onGoLibrary: controller.goLibrary,
    onGoCompose: controller.goCompose,
    onTabChange: controller.setLibraryTab,
    onChangeAnalysisMode: controller.setAnalysisMode,
    onUpdateTrackPerformance: controller.handleUpdateTrackPerformance,
    onUpdateTrackAnalysis: controller.handleUpdateTrackAnalysis,
    onStartSimpleMonitoring: controller.startSimpleMonitoring,
    onStartSimpleWizardSession: controller.startSimpleWizardSession,
    onStartSession: controller.startLiveSession,
    onStopSession: () => controller.monitor.stopSession(),
    onResumeSession: (sessionId: string) => controller.sessions.setSelectedSessionId(sessionId),
    onPlaybackSession: controller.startReplaySession,
    onReplayBookmark: (session, replayWindowIndex) =>
      controller.startReplaySession(session, replayWindowIndex),
    onDeleteSession: (sessionId: string) => controller.sessions.removeSession(sessionId),
    onSelectSession: (sessionId: string) => controller.sessions.setSelectedSessionId(sessionId),
  };
}
