import type { PersistedSession } from "./api/sessions";
import type { AppV0Language } from "./appV0Preferences";
import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSkin } from "./features/simple/appSkin";
import type { MonitorSetupPreferences } from "./features/simple/monitorSetupPreferences";
import type { MonitorLaunchSource } from "./types/monitorLaunch";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";
import type { LiveLogStreamUpdate } from "./types/monitor";

export interface AppV0SimpleMonitorSectionProps {
  skin: AppSkin;
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  trackName?: string;
  waveformBins?: number[];
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  liveSettings: MonitorSetupPreferences;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}

export interface AppV0SimpleLibrarySectionProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (id: string | null) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
  onStartMonitoring: (repoId: string) => Promise<void>;
}

export interface AppV0SetupSectionProps {
  lang: AppV0Language;
  onChangeLanguage: (lang: AppV0Language) => void;
  skin: AppSkin;
  onChangeSkin: (skin: AppSkin) => void;
  setupPreferences: MonitorSetupPreferences;
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}

export interface AppV0ProLibrarySectionProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
}

export interface AppV0ConnectionsSectionProps {
  defaultCloudLookback: string;
}

export function buildAppV0SimpleMonitorSectionProps(input: {
  skin: AppSkin;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStopMonitor: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  monitorTrackName?: string;
  waveformBins?: number[];
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  setupPreferences: MonitorSetupPreferences;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}): AppV0SimpleMonitorSectionProps {
  return {
    skin: input.skin,
    session: input.monitorSession,
    metrics: input.monitorMetrics,
    pastSessions: input.pastSessions,
    repositories: input.repositories,
    tracks: input.tracks,
    onStop: input.onStopMonitor,
    onResumeAudio: input.onResumeAudio,
    audioStatus: input.audioStatus,
    audioContext: input.audioContext,
    trackName: input.monitorTrackName,
    waveformBins: input.waveformBins,
    onStartMonitoring: input.onStartMonitoring,
    onReplaySession: input.onReplaySession,
    subscribe: input.subscribe,
    liveSettings: input.setupPreferences,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
  };
}

export function buildAppV0SimpleLibrarySectionProps(input: {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (id: string | null) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
  onStartLibraryMonitoring: (repoId: string) => Promise<void>;
}): AppV0SimpleLibrarySectionProps {
  return {
    tracks: input.tracks,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    selectedRepositoryId: input.selectedRepositoryId,
    onSelectRepository: input.onSelectRepository,
    onImportRepository: input.onImportRepository,
    onImportBaseAsset: input.onImportBaseAsset,
    selectedTrackId: input.selectedTrackId,
    onSelectTrack: input.onSelectTrack,
    onStartMonitoring: input.onStartLibraryMonitoring,
  };
}

export function buildAppV0ProLibrarySectionProps(input: {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
}): AppV0ProLibrarySectionProps {
  return {
    tracks: input.tracks,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
  };
}

export function buildAppV0ConnectionsSectionProps(input: {
  setupPreferences: MonitorSetupPreferences;
}): AppV0ConnectionsSectionProps {
  return {
    defaultCloudLookback: input.setupPreferences.defaultCloudLookback,
  };
}

export function buildAppV0SetupSectionProps(input: {
  lang: AppV0Language;
  onChangeLanguage: (lang: AppV0Language) => void;
  skin: AppSkin;
  onChangeSkin: (skin: AppSkin) => void;
  setupPreferences: MonitorSetupPreferences;
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}): AppV0SetupSectionProps {
  return {
    lang: input.lang,
    onChangeLanguage: input.onChangeLanguage,
    skin: input.skin,
    onChangeSkin: input.onChangeSkin,
    setupPreferences: input.setupPreferences,
    onUpdateSetupPreference: input.onUpdateSetupPreference,
  };
}
