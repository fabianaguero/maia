import type { PersistedSession } from "../api/sessions";
import type { AppV0FallbackViewModel } from "../appV0MonitorViewModelRuntime";
import type { AppV0Language } from "../appV0Preferences";
import type { AppV0MonitorLaunchExecutionResult } from "../appV0MonitorRuntime";
import type { AppV0ShellViewModel } from "../appV0ShellViewModel";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { AppSection } from "../features/simple/appSections";
import type { AppSkin } from "../features/simple/appSkin";
import type { MonitorLaunchSource } from "../types/monitorLaunch";
import type { MonitorSetupPreferences } from "../features/simple/monitorSetupPreferences";
import type { UserMode } from "../features/simple/UserModeContext";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../types/library";
import type { LiveLogStreamUpdate } from "../types/monitor";

export interface AppV0MonitorBindings {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  stopSession: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  audioContext: AudioContext | null;
}

export interface AppV0LibraryBindings {
  tracks: LibraryTrack[];
  selectedTrackId: string | null;
  selectedTrack: LibraryTrack | null;
  setSelectedTrackId: (id: string | null) => void;
  deleteLibraryTrack: (trackId: string) => Promise<boolean>;
}

export interface AppV0RepositoryBindings {
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  setSelectedRepositoryId: (id: string | null) => void;
  importRepositorySource: (input: ImportRepositoryInput) => Promise<unknown>;
}

export interface AppV0BaseAssetBindings {
  baseAssets: BaseAssetRecord[];
  importLibraryBaseAsset: (input: ImportBaseAssetInput) => Promise<unknown>;
}

export interface AppV0PastSessionsBindings {
  sessions: PersistedSession[];
  removeSession: (sessionId: string) => Promise<void>;
}

export interface AppV0MonitorOrchestratorBindings {
  startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
  startSourceMonitoring: (
    source: MonitorLaunchSource,
    trackId?: string,
  ) => Promise<AppV0MonitorLaunchExecutionResult>;
  replaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => Promise<void>;
}

export interface UseAppV0ScreenModelInput {
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
  monitor: AppV0MonitorBindings;
  library: AppV0LibraryBindings;
  repositories: AppV0RepositoryBindings;
  baseAssets: AppV0BaseAssetBindings;
  pastSessions: AppV0PastSessionsBindings;
  monitorOrchestrator: AppV0MonitorOrchestratorBindings;
}

export type AppV0SectionContentModelInput = UseAppV0ScreenModelInput;
