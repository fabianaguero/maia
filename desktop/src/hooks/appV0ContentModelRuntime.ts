import type { AppTranslations } from "../i18n/en";
import type { useAppV0DomainState } from "./useAppV0DomainState";
import type {
  AppV0MonitorOrchestratorBindings,
  UseAppV0ScreenModelInput,
} from "./appV0ScreenModelTypes";
import type { UseAppV0MonitorScreenStateInput } from "./useAppV0MonitorScreenState";

type AppV0DomainState = ReturnType<typeof useAppV0DomainState>;

type AppV0MonitorScreenState = {
  t: AppTranslations;
  isMonitoring: boolean;
  fallbackViewModel: {
    message: string;
    hint: string;
  };
  monitorOrchestrator: AppV0MonitorOrchestratorBindings;
  shellViewModel: UseAppV0ScreenModelInput["shellViewModel"];
  waveformBins?: number[];
  reportMonitorLaunchFailure: UseAppV0ScreenModelInput["reportMonitorLaunchFailure"];
};

export function buildAppV0MonitorScreenStateInput(
  domainState: AppV0DomainState,
): UseAppV0MonitorScreenStateInput {
  return {
    lang: domainState.preferences.lang,
    currentSection: domainState.shellState.currentSection,
    setCurrentSection: domainState.shellState.setCurrentSection,
    repositories: domainState.repositories.repositories,
    selectedRepositoryTitle: domainState.repositories.selectedRepository?.title ?? null,
    tracks: domainState.library.tracks,
    selectedTrack: domainState.library.selectedTrack ?? null,
    session: domainState.monitor.session,
    metrics: domainState.monitor.metrics,
    setGuideTrack: domainState.monitor.setGuideTrack,
    resumeAudio: domainState.monitor.resumeAudio,
    attachSession: domainState.monitor.attachSession,
    startSession: domainState.monitor.startSession,
    playbackSession: domainState.monitor.playbackSession,
  };
}

export function buildAppV0ScreenModelInput(
  domainState: AppV0DomainState,
  monitorState: AppV0MonitorScreenState,
): UseAppV0ScreenModelInput {
  return {
    userMode: domainState.userMode,
    lang: domainState.preferences.lang,
    skin: domainState.preferences.skin,
    setupPreferences: domainState.preferences.setupPreferences,
    updateSetupPreference: domainState.preferences.updateSetupPreference,
    setLang: domainState.preferences.setLang,
    setSkin: domainState.preferences.setSkin,
    currentSection: domainState.shellState.currentSection,
    setCurrentSection: domainState.shellState.setCurrentSection,
    isSidebarCollapsed: domainState.shellState.isSidebarCollapsed,
    toggleSidebarCollapsed: domainState.shellState.toggleSidebarCollapsed,
    isConsoleExpanded: domainState.shellState.isConsoleExpanded,
    toggleConsoleExpanded: domainState.shellState.toggleConsoleExpanded,
    openMonitorInspector: domainState.shellState.openMonitorInspector,
    fallbackViewModel: monitorState.fallbackViewModel,
    shellViewModel: monitorState.shellViewModel,
    isMonitoring: monitorState.isMonitoring,
    reportMonitorLaunchFailure: monitorState.reportMonitorLaunchFailure,
    waveformBins: monitorState.waveformBins,
    monitor: {
      session: domainState.monitor.session,
      metrics: domainState.monitor.metrics,
      stopSession: domainState.monitor.stopSession,
      resumeAudio: domainState.monitor.resumeAudio,
      subscribe: domainState.monitor.subscribe,
      audioContext: domainState.monitor.audioContext,
    },
    library: {
      tracks: domainState.library.tracks,
      selectedTrackId: domainState.library.selectedTrackId,
      selectedTrack: domainState.library.selectedTrack ?? null,
      setSelectedTrackId: domainState.library.setSelectedTrackId,
    },
    repositories: {
      repositories: domainState.repositories.repositories,
      selectedRepositoryId: domainState.repositories.selectedRepositoryId,
      setSelectedRepositoryId: domainState.repositories.setSelectedRepositoryId,
      importRepositorySource: domainState.repositories.importRepositorySource,
    },
    baseAssets: {
      baseAssets: domainState.baseAssets.baseAssets,
      importLibraryBaseAsset: domainState.baseAssets.importLibraryBaseAsset,
    },
    pastSessions: domainState.pastSessions,
    monitorOrchestrator: monitorState.monitorOrchestrator,
  };
}
