import type { CSSProperties } from "react";
import type { PersistedSession } from "./api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSection } from "./features/simple/appSections";
import type { AppSkin } from "./features/simple/appSkin";
import type { MonitorSetupPreferences } from "./features/simple/monitorSetupPreferences";
import type { UserMode } from "./features/simple/UserModeContext";
import type { AppV0Language } from "./appV0Preferences";
import {
  buildAppV0ConnectionsSectionProps,
  buildAppV0ProLibrarySectionProps,
  buildAppV0SetupSectionProps,
  buildAppV0SimpleLibrarySectionProps,
  buildAppV0SimpleMonitorSectionProps,
  type AppV0ConnectionsSectionProps,
  type AppV0ProLibrarySectionProps,
  type AppV0SetupSectionProps,
  type AppV0SimpleLibrarySectionProps,
  type AppV0SimpleMonitorSectionProps,
} from "./appV0SectionPropsRuntime";
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
import type { MonitorLaunchSource } from "./types/monitorLaunch";

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
  onReplaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => void;
  onDeletePastSession: (sessionId: string) => Promise<void>;
  onDeleteLibraryTrack: (trackId: string) => Promise<boolean>;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}

export interface AppV0SectionRenderModel {
  kind: AppV0SectionContentKind;
  simpleMonitorProps: AppV0SimpleMonitorSectionProps;
  simpleLibraryProps: AppV0SimpleLibrarySectionProps;
  proLibraryProps: AppV0ProLibrarySectionProps;
  connectionsProps: AppV0ConnectionsSectionProps;
  setupProps: AppV0SetupSectionProps;
  fallbackViewModel: AppV0SectionFallbackViewModel;
}

export interface AppV0SectionPropsBundle {
  simpleMonitorProps: AppV0SimpleMonitorSectionProps;
  simpleLibraryProps: AppV0SimpleLibrarySectionProps;
  proLibraryProps: AppV0ProLibrarySectionProps;
  connectionsProps: AppV0ConnectionsSectionProps;
  setupProps: AppV0SetupSectionProps;
}

export function buildAppV0SectionPropsBundle(
  input: AppV0SectionContentInput,
): AppV0SectionPropsBundle {
  return {
    simpleMonitorProps: buildAppV0SimpleMonitorSectionProps(input),
    simpleLibraryProps: buildAppV0SimpleLibrarySectionProps(input),
    proLibraryProps: buildAppV0ProLibrarySectionProps(input),
    connectionsProps: buildAppV0ConnectionsSectionProps(input),
    setupProps: buildAppV0SetupSectionProps(input),
  };
}

export function buildAppV0SectionRenderModel(
  input: AppV0SectionContentInput,
): AppV0SectionRenderModel {
  const propsBundle = buildAppV0SectionPropsBundle(input);

  return {
    kind: resolveAppV0SectionContentKind({
      currentSection: input.currentSection,
      userMode: input.userMode,
    }),
    ...propsBundle,
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
