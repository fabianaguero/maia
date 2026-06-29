import type { CSSProperties } from "react";
import type { PersistedSession } from "./api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSection } from "./features/simple/appSections";
import type { AppSkin } from "./features/simple/appSkin";
import type { MonitorLaunchSource } from "./features/simple/monitorSourceOptions";
import type { MonitorSetupPreferences } from "./features/simple/monitorSetupPreferences";
import type { UserMode } from "./features/simple/UserModeContext";
import type { AppV0Language } from "./appV0Preferences";
import {
  resolveAppV0SectionContentKind,
  type AppV0SectionContentKind,
} from "./appV0SectionViewModel";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";
import type { LiveLogStreamUpdate } from "./types/monitor";

export interface AppV0SectionFallbackViewModel {
  message: string;
  hint: string;
}

export interface AppV0SectionContentInput {
  currentSection: AppSection;
  userMode: UserMode;
  fallbackViewModel: AppV0SectionFallbackViewModel;
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
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
  onStartLibraryMonitoring: (repoId: string) => Promise<void>;
  onStopMonitor: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  monitorTrackName?: string;
  waveformBins?: number[];
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}

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

export interface AppV0SectionRenderModel {
  kind: AppV0SectionContentKind;
  simpleMonitorProps: AppV0SimpleMonitorSectionProps;
  simpleLibraryProps: AppV0SimpleLibrarySectionProps;
  proLibraryProps: {
    tracks: LibraryTrack[];
    repositories: RepositoryAnalysis[];
    baseAssets: BaseAssetRecord[];
  };
  connectionsProps: {
    defaultCloudLookback: string;
  };
  setupProps: AppV0SetupSectionProps;
  fallbackViewModel: AppV0SectionFallbackViewModel;
}

export function buildAppV0SectionRenderModel(
  input: AppV0SectionContentInput,
): AppV0SectionRenderModel {
  return {
    kind: resolveAppV0SectionContentKind({
      currentSection: input.currentSection,
      userMode: input.userMode,
    }),
    simpleMonitorProps: {
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
    },
    simpleLibraryProps: {
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
    },
    proLibraryProps: {
      tracks: input.tracks,
      repositories: input.repositories,
      baseAssets: input.baseAssets,
    },
    connectionsProps: {
      defaultCloudLookback: input.setupPreferences.defaultCloudLookback,
    },
    setupProps: {
      lang: input.lang,
      onChangeLanguage: input.onChangeLanguage,
      skin: input.skin,
      onChangeSkin: input.onChangeSkin,
      setupPreferences: input.setupPreferences,
      onUpdateSetupPreference: input.onUpdateSetupPreference,
    },
    fallbackViewModel: input.fallbackViewModel,
  };
}

export function buildAppV0FallbackPanelStyle(): CSSProperties {
  return {
    padding: "3rem",
    textAlign: "center",
    color: "#a8b3c1",
    fontSize: "14px",
  };
}
