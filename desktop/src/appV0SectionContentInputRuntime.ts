import type { PersistedSession } from "./api/sessions";
import type { AppV0FallbackViewModel } from "./appV0MonitorViewModelRuntime";
import type { AppV0Language } from "./appV0Preferences";
import type { AppV0SectionContentInput } from "./appV0SectionContentRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSkin } from "./features/simple/appSkin";
import type { MonitorSetupPreferences } from "./features/simple/monitorSetupPreferences";
import type { UserMode } from "./features/simple/UserModeContext";
import type { BaseAssetRecord, LibraryTrack, RepositoryAnalysis } from "./types/library";
import type { LiveLogStreamUpdate } from "./types/monitor";

export function buildAppV0SectionContentInput(input: {
  currentSection: AppV0SectionContentInput["currentSection"];
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
  onDeletePastSession: AppV0SectionContentInput["onDeletePastSession"];
  onDeleteLibraryTrack: AppV0SectionContentInput["onDeleteLibraryTrack"];
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
    onDeletePastSession: input.onDeletePastSession,
    onDeleteLibraryTrack: input.onDeleteLibraryTrack,
    subscribe: input.subscribe,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
  };
}
