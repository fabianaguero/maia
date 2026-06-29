import { useBaseAssets } from "./useBaseAssets";
import { useCompositionResults } from "./useCompositionResults";
import { useLibrary } from "./useLibrary";
import { useRepositories } from "./useRepositories";
import { useSessions } from "./useSessions";
import { useAppV0PreferencesState } from "./useAppV0PreferencesState";
import { useAppV0ShellState } from "./useAppV0ShellState";
import { useAppV0MonitorScreenState } from "./useAppV0MonitorScreenState";
import { useAppV0ScreenModel } from "./useAppV0ScreenModel";
import { useMonitor } from "../features/monitor/MonitorContext";
import { useUserMode } from "../features/simple/UserModeContext";

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

  const { screenModel } = useAppV0ScreenModel({
    userMode,
    lang,
    skin,
    setupPreferences,
    updateSetupPreference,
    setLang,
    setSkin,
    currentSection,
    setCurrentSection,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isConsoleExpanded,
    toggleConsoleExpanded,
    openMonitorInspector,
    fallbackViewModel,
    shellViewModel,
    isMonitoring,
    reportMonitorLaunchFailure,
    waveformBins,
    monitor: {
      session: monitor.session,
      metrics: monitor.metrics,
      stopSession: monitor.stopSession,
      resumeAudio: monitor.resumeAudio,
      subscribe: monitor.subscribe,
      audioContext: monitor.audioContext,
    },
    library: {
      tracks: library.tracks,
      selectedTrackId: library.selectedTrackId,
      selectedTrack: library.selectedTrack ?? null,
      setSelectedTrackId: library.setSelectedTrackId,
    },
    repositories: {
      repositories: repositories.repositories,
      selectedRepositoryId: repositories.selectedRepositoryId,
      setSelectedRepositoryId: repositories.setSelectedRepositoryId,
      importRepositorySource: repositories.importRepositorySource,
    },
    baseAssets: {
      baseAssets: baseAssets.baseAssets,
      importLibraryBaseAsset: baseAssets.importLibraryBaseAsset,
    },
    pastSessions,
    monitorOrchestrator,
  });

  return { screenModel, t };
}
