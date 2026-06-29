import type { PersistedSession } from "./api/sessions";
import type { AppShellProps } from "./components/AppShell";
import type { AppV0SectionContentInput } from "./appV0SectionContentRuntime";
import type { AppV0FallbackViewModel } from "./appV0MonitorViewModelRuntime";
import type { AppV0Language } from "./appV0Preferences";
import type { AppV0MonitorLaunchExecutionResult } from "./appV0MonitorRuntime";
import type { AppV0ShellViewModel } from "./appV0ShellViewModel";
import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSection } from "./features/simple/appSections";
import type { AppSkin } from "./features/simple/appSkin";
import type { MonitorLaunchSource } from "./features/simple/monitorSourceOptions";
import type { MonitorSetupPreferences } from "./features/simple/monitorSetupPreferences";
import type { UserMode } from "./features/simple/UserModeContext";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";
import type { LiveLogStreamUpdate } from "./types/monitor";

export interface AppV0ContentActions {
  onSectionChange: (section: AppSection) => void;
  onInspect: () => void;
  onStopMonitoring: () => void;
  onImportRepository: (nextInput: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (nextInput: ImportBaseAssetInput) => Promise<boolean>;
  onStartLibraryMonitoring: (repoId: string) => Promise<void>;
  onStopMonitor: () => Promise<void>;
  onResumeAudio: () => Promise<void>;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
  onInspectFloatingWaveform: () => void;
}

export function buildAppV0ContentActions(input: {
  setCurrentSection: (section: AppSection) => void;
  stopSession: () => Promise<void>;
  importRepositorySource: (input: ImportRepositoryInput) => Promise<unknown>;
  importLibraryBaseAsset: (input: ImportBaseAssetInput) => Promise<unknown>;
  startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
  startSourceMonitoring: (
    source: MonitorLaunchSource,
    trackId?: string,
  ) => Promise<AppV0MonitorLaunchExecutionResult>;
  reportMonitorLaunchFailure: (
    scope: "library" | "source",
    result: AppV0MonitorLaunchExecutionResult,
  ) => void;
  resumeAudio: () => Promise<void>;
  replaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
}): AppV0ContentActions {
  return {
    onSectionChange: (section: AppSection) => {
      input.setCurrentSection(section);
    },
    onInspect: () => {
      input.setCurrentSection("inspect");
    },
    onStopMonitoring: () => {
      void input.stopSession();
    },
    onImportRepository: async (nextInput: ImportRepositoryInput): Promise<boolean> => {
      const repository = await input.importRepositorySource(nextInput);
      return Boolean(repository);
    },
    onImportBaseAsset: async (nextInput: ImportBaseAssetInput): Promise<boolean> => {
      const asset = await input.importLibraryBaseAsset(nextInput);
      return Boolean(asset);
    },
    onStartLibraryMonitoring: async (repoId: string): Promise<void> => {
      const result = await input.startLibraryMonitoring(repoId);
      input.reportMonitorLaunchFailure("library", result);
    },
    onStopMonitor: () => input.stopSession(),
    onResumeAudio: () => input.resumeAudio(),
    onStartMonitoring: async (source: MonitorLaunchSource, trackId?: string): Promise<void> => {
      const result = await input.startSourceMonitoring(source, trackId);
      input.reportMonitorLaunchFailure("source", result);
    },
    onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) =>
      input.replaySession(sessionId, sourcePath, repoTitle),
    onInspectFloatingWaveform: () => {
      input.setCurrentSection("monitor");
    },
  };
}

export function buildAppV0ShellProps(input: {
  currentSection: AppSection;
  isMonitoring: boolean;
  monitoringStatus: AppShellProps["monitoringStatus"];
  selectedItem: string;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  onSectionChange: NonNullable<AppShellProps["onSectionChange"]>;
  onInspect: NonNullable<AppShellProps["onInspect"]>;
  onStopMonitoring: NonNullable<AppShellProps["onStopMonitoring"]>;
  isCollapsed: boolean;
  onToggleCollapse: NonNullable<AppShellProps["onToggleCollapse"]>;
}): Omit<AppShellProps, "children"> {
  return {
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    monitoringStatus: input.monitoringStatus,
    selectedItem: input.selectedItem,
    trackCount: input.trackCount,
    repositoryCount: input.repositoryCount,
    baseAssetCount: input.baseAssetCount,
    onSectionChange: input.onSectionChange,
    onInspect: input.onInspect,
    onStopMonitoring: input.onStopMonitoring,
    isCollapsed: input.isCollapsed,
    onToggleCollapse: input.onToggleCollapse,
  };
}

export function buildAppV0SectionContentInput(input: {
  currentSection: AppSection;
  userMode: UserMode;
  fallbackViewModel: AppV0FallbackViewModel;
  setupPreferences: MonitorSetupPreferences;
  lang: AppV0Language;
  skin: AppSkin;
  onChangeLanguage: (lang: AppV0Language) => void;
  onChangeSkin: (skin: AppSkin) => void;
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (id: string | null) => void;
  onImportRepository: AppV0SectionContentInput["onImportRepository"];
  onImportBaseAsset: AppV0SectionContentInput["onImportBaseAsset"];
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
  onStartLibraryMonitoring: AppV0SectionContentInput["onStartLibraryMonitoring"];
  onStopMonitor: AppV0SectionContentInput["onStopMonitor"];
  onResumeAudio: AppV0SectionContentInput["onResumeAudio"];
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  monitorTrackName?: string;
  waveformBins?: number[];
  onStartMonitoring: AppV0SectionContentInput["onStartMonitoring"];
  onReplaySession: AppV0SectionContentInput["onReplaySession"];
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}): AppV0SectionContentInput {
  return {
    currentSection: input.currentSection,
    userMode: input.userMode,
    fallbackViewModel: input.fallbackViewModel,
    setupPreferences: input.setupPreferences,
    lang: input.lang,
    skin: input.skin,
    onChangeLanguage: input.onChangeLanguage,
    onChangeSkin: input.onChangeSkin,
    onUpdateSetupPreference: input.onUpdateSetupPreference,
    monitorSession: input.monitorSession,
    monitorMetrics: input.monitorMetrics,
    pastSessions: input.pastSessions,
    repositories: input.repositories,
    tracks: input.tracks,
    baseAssets: input.baseAssets,
    selectedRepositoryId: input.selectedRepositoryId,
    onSelectRepository: input.onSelectRepository,
    onImportRepository: input.onImportRepository,
    onImportBaseAsset: input.onImportBaseAsset,
    selectedTrackId: input.selectedTrackId,
    onSelectTrack: input.onSelectTrack,
    onStartLibraryMonitoring: input.onStartLibraryMonitoring,
    onStopMonitor: input.onStopMonitor,
    onResumeAudio: input.onResumeAudio,
    audioStatus: input.audioStatus,
    audioContext: input.audioContext,
    monitorTrackName: input.monitorTrackName,
    waveformBins: input.waveformBins,
    onStartMonitoring: input.onStartMonitoring,
    onReplaySession: input.onReplaySession,
    subscribe: input.subscribe,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
  };
}

export interface BuildAppV0ScreenModelArgs {
  shell: {
    currentSection: AppSection;
    isSidebarCollapsed: boolean;
    toggleSidebarCollapsed: () => void;
    isConsoleExpanded: boolean;
    toggleConsoleExpanded: () => void;
    openMonitorInspector: () => void;
  };
  contentActions: AppV0ContentActions;
  shellViewModel: AppV0ShellViewModel;
  currentSection: AppSection;
  isMonitoring: boolean;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  sectionContentInput: AppV0SectionContentInput;
}

export function buildAppV0ScreenModel(input: BuildAppV0ScreenModelArgs): {
  appShellProps: Omit<AppShellProps, "children">;
  sectionContentInput: AppV0SectionContentInput;
  floatingWaveformBarProps: {
    isActive: true;
    source: string;
    anomalies: number;
    uptime: string;
    onStop: () => void;
    onInspect: () => void;
  } | null;
} {
  const appShellProps = buildAppV0ShellProps({
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    monitoringStatus: input.shellViewModel.monitoringStatus,
    selectedItem: input.shellViewModel.selectedItem,
    trackCount: input.trackCount,
    repositoryCount: input.repositoryCount,
    baseAssetCount: input.baseAssetCount,
    onSectionChange: input.contentActions.onSectionChange,
    onInspect: input.shell.openMonitorInspector,
    onStopMonitoring: input.contentActions.onStopMonitoring,
    isCollapsed: input.shell.isSidebarCollapsed,
    onToggleCollapse: input.shell.toggleSidebarCollapsed,
  });

  return {
    appShellProps,
    sectionContentInput: input.sectionContentInput,
    floatingWaveformBarProps: input.shellViewModel.floatingWaveformBar.isVisible
      ? {
          isActive: true,
          source: input.shellViewModel.floatingWaveformBar.source,
          anomalies: input.shellViewModel.floatingWaveformBar.anomalies,
          uptime: input.shellViewModel.floatingWaveformBar.uptime,
          onStop: input.contentActions.onStopMonitoring,
          onInspect: input.contentActions.onInspectFloatingWaveform,
        }
      : null,
  };
}
