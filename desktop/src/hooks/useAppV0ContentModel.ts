import { useBaseAssets } from "./useBaseAssets";
import { useCompositionResults } from "./useCompositionResults";
import { useLibrary } from "./useLibrary";
import { useRepositories } from "./useRepositories";
import { useSessions } from "./useSessions";
import { useAppV0PreferencesState } from "./useAppV0PreferencesState";
import { useAppV0ShellState } from "./useAppV0ShellState";
import { useAppV0MonitorScreenState } from "./useAppV0MonitorScreenState";
import { useMonitor } from "../features/monitor/MonitorContext";
import { useUserMode } from "../features/simple/UserModeContext";
import {
  buildAppV0ContentActions,
  buildAppV0ScreenModel,
  buildAppV0SectionContentInput,
} from "../appV0ViewModel";

export function useAppV0ContentModel() {
  const { userMode } = useUserMode();
  const { lang, setLang, skin, setSkin, setupPreferences, updateSetupPreference } =
    useAppV0PreferencesState();
  const {
    currentSection,
    setCurrentSection,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isConsoleExpanded,
    openMonitorInspector,
    toggleConsoleExpanded,
  } = useAppV0ShellState();

  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  useCompositionResults();
  const monitor = useMonitor();
  const pastSessions = useSessions();

  const {
    t,
    isMonitoring,
    fallbackViewModel,
    monitorOrchestrator,
    shellViewModel,
    waveformBins,
    reportMonitorLaunchFailure,
  } = useAppV0MonitorScreenState({
    lang,
    currentSection,
    setCurrentSection,
    repositories: repositories.repositories,
    selectedRepositoryTitle: repositories.selectedRepository?.title ?? null,
    tracks: library.tracks,
    selectedTrack: library.selectedTrack ?? null,
    session: monitor.session,
    metrics: monitor.metrics,
    setGuideTrack: monitor.setGuideTrack,
    resumeAudio: monitor.resumeAudio,
    attachSession: monitor.attachSession,
    startSession: monitor.startSession,
    playbackSession: monitor.playbackSession,
  });

  const contentActions = buildAppV0ContentActions({
    setCurrentSection,
    stopSession: monitor.stopSession,
    importRepositorySource: repositories.importRepositorySource,
    importLibraryBaseAsset: baseAssets.importLibraryBaseAsset,
    startLibraryMonitoring: monitorOrchestrator.startLibraryMonitoring,
    startSourceMonitoring: monitorOrchestrator.startSourceMonitoring,
    reportMonitorLaunchFailure,
    resumeAudio: monitor.resumeAudio,
    replaySession: monitorOrchestrator.replaySession,
  });
  const sectionContentInput = buildAppV0SectionContentInput({
    currentSection,
    userMode,
    fallbackViewModel,
    setupPreferences,
    lang,
    skin,
    onChangeLanguage: setLang,
    onChangeSkin: setSkin,
    onUpdateSetupPreference: updateSetupPreference,
    monitorSession: monitor.session,
    monitorMetrics: monitor.metrics,
    pastSessions: pastSessions.sessions,
    repositories: repositories.repositories,
    tracks: library.tracks,
    baseAssets: baseAssets.baseAssets,
    selectedRepositoryId: repositories.selectedRepositoryId,
    onSelectRepository: repositories.setSelectedRepositoryId,
    onImportRepository: contentActions.onImportRepository,
    onImportBaseAsset: contentActions.onImportBaseAsset,
    selectedTrackId: library.selectedTrackId,
    onSelectTrack: library.setSelectedTrackId,
    onStartLibraryMonitoring: contentActions.onStartLibraryMonitoring,
    onStopMonitor: contentActions.onStopMonitor,
    onResumeAudio: contentActions.onResumeAudio,
    audioStatus: monitor.audioContext?.state || "closed",
    audioContext: monitor.audioContext,
    monitorTrackName: monitor.session?.trackName,
    waveformBins,
    onStartMonitoring: contentActions.onStartMonitoring,
    onReplaySession: contentActions.onReplaySession,
    subscribe: monitor.subscribe,
    isConsoleExpanded,
    onToggleConsole: toggleConsoleExpanded,
  });
  const screenModel = buildAppV0ScreenModel({
    shell: {
      currentSection,
      isSidebarCollapsed,
      toggleSidebarCollapsed,
      isConsoleExpanded,
      toggleConsoleExpanded,
      openMonitorInspector,
    },
    contentActions,
    shellViewModel,
    currentSection,
    isMonitoring,
    trackCount: library.tracks.length,
    repositoryCount: repositories.repositories.length,
    baseAssetCount: baseAssets.baseAssets.length,
    sectionContentInput,
  });

  return { screenModel, t };
}
