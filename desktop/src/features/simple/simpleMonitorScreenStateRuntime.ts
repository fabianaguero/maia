import type { AppTranslations } from "../../i18n/types";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import { coerceSimpleMonitorCollection } from "./simpleMonitorViewModel";
import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";
import {
  buildSimpleMonitorActiveHookArgs,
  buildSimpleMonitorIdleHookArgs,
  buildSimpleMonitorScreenMeta,
} from "./simpleMonitorScreenHookArgsRuntime";
import type {
  SimpleMonitorDeckRuntimeSlice,
  SimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";

export interface SimpleMonitorCollectionsState {
  safePastSessions: PersistedSession[];
  safeRepositories: RepositoryAnalysis[];
  safeTracks: LibraryTrack[];
}

export function getSimpleMonitorTrackTitle(track: LibraryTrack): string {
  return getLibraryTrackTitle(track);
}

export function buildSimpleMonitorCollectionsState(input: {
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
}): SimpleMonitorCollectionsState {
  return {
    safePastSessions: coerceSimpleMonitorCollection(input.pastSessions),
    safeRepositories: coerceSimpleMonitorCollection(input.repositories),
    safeTracks: coerceSimpleMonitorCollection(input.tracks),
  };
}

export function buildSimpleMonitorScreenHookStateArgs(input: {
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
  const screenMeta = buildSimpleMonitorScreenMeta(input);
  const activeHookArgs = buildSimpleMonitorActiveHookArgs({
    screenMeta,
    metrics: input.metrics,
    isMonitorActive: input.deckRuntime.isMonitorActive,
    isAnomalyFilterActive: input.isAnomalyFilterActive,
    onToggleAnomalyFilter: input.onToggleAnomalyFilter,
    onClearAnomalyFilter: input.onClearAnomalyFilter,
    onStop: input.onStop,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
    onRefresh: input.onRefresh,
    onSimulateLog: input.onSimulateLog,
    onResumeAudio: input.onResumeAudio,
    deckRuntime: input.deckRuntime,
    audioStatus: input.audioStatus,
  });
  const idleHookArgs = buildSimpleMonitorIdleHookArgs({
    launchState: input.launchState,
    collections: input.collections,
    deckRuntime: input.deckRuntime,
    onReplaySession: input.onReplaySession,
    onDeletePastSession: input.onDeletePastSession,
    onDeleteLibraryTrack: input.onDeleteLibraryTrack,
  });

  return {
    ...activeHookArgs,
    ...idleHookArgs,
  };
}
