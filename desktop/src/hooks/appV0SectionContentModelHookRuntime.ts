import type { AppV0SectionContentInput } from "../appV0SectionContentRuntime";
import type { AppV0ContentActions } from "../appV0ScreenCompositionRuntime";
import type { buildAppV0SectionContentInput } from "../appV0ScreenCompositionRuntime";
import type { AppV0SectionContentModelInput } from "./appV0ScreenModelTypes";

export function buildAppV0SectionContentActionsInput(input: AppV0SectionContentModelInput) {
  return {
    setCurrentSection: input.setCurrentSection,
    stopSession: input.monitor.stopSession,
    importRepositorySource: input.repositories.importRepositorySource,
    importLibraryBaseAsset: input.baseAssets.importLibraryBaseAsset,
    startLibraryMonitoring: input.monitorOrchestrator.startLibraryMonitoring,
    startSourceMonitoring: input.monitorOrchestrator.startSourceMonitoring,
    reportMonitorLaunchFailure: input.reportMonitorLaunchFailure,
    resumeAudio: input.monitor.resumeAudio,
    replaySession: input.monitorOrchestrator.replaySession,
  };
}

export function buildAppV0SectionContentStateInput(
  input: AppV0SectionContentModelInput,
  contentActions: AppV0ContentActions,
): Parameters<typeof buildAppV0SectionContentInput>[0] {
  return {
    currentSection: input.currentSection,
    userMode: input.userMode,
    fallbackViewModel: input.fallbackViewModel,
    setupPreferences: input.setupPreferences,
    lang: input.lang,
    skin: input.skin,
    onChangeLanguage: input.setLang,
    onChangeSkin: input.setSkin,
    onUpdateSetupPreference: input.updateSetupPreference,
    monitorSession: input.monitor.session,
    monitorMetrics: input.monitor.metrics,
    pastSessions: input.pastSessions.sessions,
    repositories: input.repositories.repositories,
    tracks: input.library.tracks,
    baseAssets: input.baseAssets.baseAssets,
    selectedRepositoryId: input.repositories.selectedRepositoryId,
    onSelectRepository: input.repositories.setSelectedRepositoryId,
    onImportRepository: contentActions.onImportRepository,
    onImportBaseAsset: contentActions.onImportBaseAsset,
    selectedTrackId: input.library.selectedTrackId,
    onSelectTrack: input.library.setSelectedTrackId,
    onStartLibraryMonitoring: contentActions.onStartLibraryMonitoring,
    onStopMonitor: contentActions.onStopMonitor,
    onResumeAudio: contentActions.onResumeAudio,
    audioStatus: input.monitor.audioContext?.state || "closed",
    audioContext: input.monitor.audioContext,
    monitorTrackName: input.monitor.session?.trackName,
    waveformBins: input.waveformBins,
    onStartMonitoring: contentActions.onStartMonitoring,
    onReplaySession: contentActions.onReplaySession,
    onDeletePastSession: input.pastSessions.removeSession,
    onDeleteLibraryTrack: input.library.deleteLibraryTrack,
    subscribe: input.monitor.subscribe,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.toggleConsoleExpanded,
  };
}

export function buildAppV0SectionContentHookResult(input: {
  contentActions: AppV0ContentActions;
  sectionContentInput: AppV0SectionContentInput;
}) {
  return input;
}
