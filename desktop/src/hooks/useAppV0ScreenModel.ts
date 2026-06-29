import type { PersistedSession } from "../api/sessions";
import {
  buildAppV0ContentActions,
  buildAppV0ScreenModel,
  buildAppV0SectionContentInput,
  type AppV0ContentActions,
} from "../appV0ScreenCompositionRuntime";
import type { AppSection } from "../features/simple/appSections";
import type { AppSkin } from "../features/simple/appSkin";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { MonitorLaunchSource } from "../features/simple/monitorSourceOptions";
import type { MonitorSetupPreferences } from "../features/simple/monitorSetupPreferences";
import type { UserMode } from "../features/simple/UserModeContext";
import type { AppV0Language } from "../appV0Preferences";
import type { AppV0FallbackViewModel } from "../appV0MonitorViewModelRuntime";
import type { AppV0ShellViewModel } from "../appV0ShellViewModel";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../types/library";
import type { LiveLogStreamUpdate } from "../types/monitor";
import type { AppV0MonitorLaunchExecutionResult } from "../appV0MonitorRuntime";

interface UseAppV0ScreenModelInput {
  userMode: UserMode;
  lang: AppV0Language;
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
  updateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
  setLang: (lang: AppV0Language) => void;
  setSkin: (skin: AppSkin) => void;
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isConsoleExpanded: boolean;
  toggleConsoleExpanded: () => void;
  openMonitorInspector: () => void;
  fallbackViewModel: AppV0FallbackViewModel;
  shellViewModel: AppV0ShellViewModel;
  waveformBins?: number[];
  isMonitoring: boolean;
  reportMonitorLaunchFailure: (
    scope: "library" | "source",
    result: AppV0MonitorLaunchExecutionResult,
  ) => void;
  monitor: {
    session: ActiveMonitorSession | null;
    metrics: MonitorMetrics;
    stopSession: () => Promise<void>;
    resumeAudio: () => Promise<void>;
    subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
    audioContext: AudioContext | null;
  };
  library: {
    tracks: LibraryTrack[];
    selectedTrackId: string | null;
    selectedTrack: LibraryTrack | null;
    setSelectedTrackId: (id: string | null) => void;
  };
  repositories: {
    repositories: RepositoryAnalysis[];
    selectedRepositoryId: string | null;
    setSelectedRepositoryId: (id: string | null) => void;
    importRepositorySource: (input: ImportRepositoryInput) => Promise<unknown>;
  };
  baseAssets: {
    baseAssets: BaseAssetRecord[];
    importLibraryBaseAsset: (input: ImportBaseAssetInput) => Promise<unknown>;
  };
  pastSessions: {
    sessions: PersistedSession[];
  };
  monitorOrchestrator: {
    startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
    startSourceMonitoring: (
      source: MonitorLaunchSource,
      trackId?: string,
    ) => Promise<AppV0MonitorLaunchExecutionResult>;
    replaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
  };
}

export function useAppV0ScreenModel(input: UseAppV0ScreenModelInput) {
  const contentActions: AppV0ContentActions = buildAppV0ContentActions({
    setCurrentSection: input.setCurrentSection,
    stopSession: input.monitor.stopSession,
    importRepositorySource: input.repositories.importRepositorySource,
    importLibraryBaseAsset: input.baseAssets.importLibraryBaseAsset,
    startLibraryMonitoring: input.monitorOrchestrator.startLibraryMonitoring,
    startSourceMonitoring: input.monitorOrchestrator.startSourceMonitoring,
    reportMonitorLaunchFailure: input.reportMonitorLaunchFailure,
    resumeAudio: input.monitor.resumeAudio,
    replaySession: input.monitorOrchestrator.replaySession,
  });

  const sectionContentInput = buildAppV0SectionContentInput({
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
    subscribe: input.monitor.subscribe,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.toggleConsoleExpanded,
  });

  const screenModel = buildAppV0ScreenModel({
    shell: {
      currentSection: input.currentSection,
      isSidebarCollapsed: input.isSidebarCollapsed,
      toggleSidebarCollapsed: input.toggleSidebarCollapsed,
      isConsoleExpanded: input.isConsoleExpanded,
      toggleConsoleExpanded: input.toggleConsoleExpanded,
      openMonitorInspector: input.openMonitorInspector,
    },
    contentActions,
    shellViewModel: input.shellViewModel,
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    trackCount: input.library.tracks.length,
    repositoryCount: input.repositories.repositories.length,
    baseAssetCount: input.baseAssets.baseAssets.length,
    sectionContentInput,
  });

  return {
    contentActions,
    sectionContentInput,
    screenModel,
  };
}
