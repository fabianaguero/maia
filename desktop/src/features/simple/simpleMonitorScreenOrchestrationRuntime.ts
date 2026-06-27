import type { AppTranslations } from "../../i18n/en";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../monitor/monitorContextTypes";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { MonitorLaunchSource } from "./monitorSourceOptions";
import type { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import type { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import type { UseSimpleMonitorDeckRuntimeInput } from "./useSimpleMonitorDeckRuntime";
import type { UseSimpleMonitorLaunchStateInput } from "./useSimpleMonitorLaunchState";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";
import { buildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenStateRuntime";

type LaunchStateSlice = ReturnType<typeof useSimpleMonitorLaunchState>;
type DeckRuntimeSlice = ReturnType<typeof useSimpleMonitorDeckRuntime>;

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
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  launchState: LaunchStateSlice;
  deckRuntime: DeckRuntimeSlice;
  collections: SimpleMonitorCollectionsState;
  audioStatus: AudioContextState;
}): BuildSimpleMonitorScreenHookStateArgs {
  return buildSimpleMonitorScreenHookStateArgs(input);
}
