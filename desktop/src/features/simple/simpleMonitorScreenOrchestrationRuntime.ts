import type { AppTranslations } from "../../i18n/types";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import type { UseSimpleMonitorLaunchStateInput } from "./useSimpleMonitorLaunchState";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";
import { buildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenStateRuntime";
import type {
  SimpleMonitorDeckRuntimeSlice,
  SimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";

export function buildSimpleMonitorLaunchStateInput(input: {
  repositories: RepositoryAnalysis[];
  isListening: boolean;
  t: AppTranslations;
  onResumeAudio: () => Promise<void> | void;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
}): UseSimpleMonitorLaunchStateInput {
  return {
    repositories: input.repositories,
    isListening: input.isListening,
    t: input.t,
    onResumeAudio: input.onResumeAudio,
    onStartMonitoring: input.onStartMonitoring,
  };
}

export function buildSimpleMonitorDeckRuntimeInput(input: {
  skin?: AppSkin;
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  safeTracks: LibraryTrack[];
  trackName?: string;
  audioContext: AudioContext | null;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  waveformBins?: number[];
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  liveSettings: MonitorSetupPreferences;
  t: AppTranslations;
}): UseSimpleMonitorDeckRuntimeInput {
  return {
    skin: input.skin,
    session: input.session,
    isListening: input.isListening,
    isLaunchingMonitor: input.isLaunchingMonitor,
    safeTracks: input.safeTracks,
    trackName: input.trackName,
    audioContext: input.audioContext,
    subscribe: input.subscribe,
    waveformBins: input.waveformBins,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
    liveSettings: input.liveSettings,
    t: input.t,
  };
}

export function buildSimpleMonitorScreenHookArgsInput(input: {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  t: AppTranslations;
  nowMs: number;
  trackName?: string;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onStop: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  onResumeAudio: () => Promise<void> | void;
  onReplaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => void;
  onDeletePastSession: (sessionId: string) => Promise<void>;
  onDeleteLibraryTrack: (trackId: string) => Promise<boolean>;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  launchState: SimpleMonitorLaunchStateSlice;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  collections: SimpleMonitorCollectionsState;
  audioStatus: AudioContextState;
}): BuildSimpleMonitorScreenHookStateArgs {
  return buildSimpleMonitorScreenHookStateArgs(input);
}
