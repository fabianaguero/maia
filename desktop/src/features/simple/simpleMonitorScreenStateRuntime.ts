import type { AppTranslations } from "../../i18n/en";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import type { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import type { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import { coerceSimpleMonitorCollection } from "./simpleMonitorViewModel";
import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";
import {
  buildSimpleMonitorActiveHookArgs,
  buildSimpleMonitorIdleHookArgs,
  buildSimpleMonitorScreenMeta,
} from "./simpleMonitorScreenHookArgsRuntime";

type LaunchStateSlice = ReturnType<typeof useSimpleMonitorLaunchState>;
type DeckRuntimeSlice = ReturnType<typeof useSimpleMonitorDeckRuntime>;

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
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  launchState: LaunchStateSlice;
  deckRuntime: DeckRuntimeSlice;
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
  });

  return {
    ...activeHookArgs,
    ...idleHookArgs,
  };
}
