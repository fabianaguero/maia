import type { AppTranslations } from "../../i18n/types";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorDeckRuntimeInput,
  buildSimpleMonitorLaunchStateInput,
} from "./simpleMonitorScreenOrchestrationRuntime";
import {
  buildSimpleMonitorDeckRuntimeSlice,
  buildSimpleMonitorLaunchStateSlice,
  type SimpleMonitorDeckRuntimeSlice,
  type SimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";

export interface UseSimpleMonitorScreenControllerSlicesInput {
  state: SimpleMonitorScreenStateInput;
  collections: SimpleMonitorCollectionsState;
  isListening: boolean;
  t: AppTranslations;
}

export interface SimpleMonitorAnomalyFilterStateSlice {
  isAnomalyFilterActive: boolean;
  handleToggleAnomalyFilter: () => void;
  handleClearAnomalyFilter: () => void;
}

export function buildSimpleMonitorScreenControllerRuntimeInput(
  input: SimpleMonitorScreenStateInput,
): SimpleMonitorScreenStateInput {
  return input;
}

export function buildSimpleMonitorScreenControllerCollectionsInput(
  input: Pick<SimpleMonitorScreenStateInput, "pastSessions" | "repositories" | "tracks">,
) {
  return {
    pastSessions: input.pastSessions,
    repositories: input.repositories,
    tracks: input.tracks,
  };
}

export function buildSimpleMonitorScreenControllerSlicesHookInput(input: {
  state: SimpleMonitorScreenStateInput;
  collections: SimpleMonitorCollectionsState;
  isListening: boolean;
  t: AppTranslations;
}): UseSimpleMonitorScreenControllerSlicesInput {
  return input;
}

export function buildSimpleMonitorScreenControllerLaunchHookArgs(input: {
  collections: Pick<SimpleMonitorCollectionsState, "safeRepositories">;
  isListening: boolean;
  t: AppTranslations;
  onResumeAudio: NonNullable<SimpleMonitorScreenStateInput["onResumeAudio"]>;
  onStartMonitoring: NonNullable<SimpleMonitorScreenStateInput["onStartMonitoring"]>;
}) {
  return {
    repositories: input.collections.safeRepositories,
    isListening: input.isListening,
    t: input.t,
    onResumeAudio: input.onResumeAudio,
    onStartMonitoring: input.onStartMonitoring,
  };
}

export function buildSimpleMonitorScreenControllerDeckHookArgs(input: {
  state: SimpleMonitorScreenStateInput;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  collections: Pick<SimpleMonitorCollectionsState, "safeTracks">;
  t: AppTranslations;
}) {
  return {
    skin: input.state.skin,
    session: input.state.session,
    isListening: input.isListening,
    isLaunchingMonitor: input.isLaunchingMonitor,
    safeTracks: input.collections.safeTracks,
    trackName: input.state.trackName,
    audioContext: input.state.audioContext,
    subscribe: input.state.subscribe,
    waveformBins: input.state.waveformBins,
    isConsoleExpanded: input.state.isConsoleExpanded ?? false,
    onToggleConsole: input.state.onToggleConsole,
    liveSettings: input.state.liveSettings,
    t: input.t,
  };
}

export function buildSimpleMonitorScreenControllerAnomalyFilterArgs(
  input: Pick<SimpleMonitorScreenStateInput, "isConsoleExpanded" | "onToggleConsole">,
) {
  return {
    isConsoleExpanded: input.isConsoleExpanded ?? false,
    onToggleConsole: input.onToggleConsole,
  };
}

export function buildSimpleMonitorScreenControllerLaunchStateInput(
  input: UseSimpleMonitorScreenControllerSlicesInput,
) {
  return buildSimpleMonitorLaunchStateInput(
    buildSimpleMonitorScreenControllerLaunchHookArgs({
      collections: input.collections,
      isListening: input.isListening,
      t: input.t,
      onResumeAudio: input.state.onResumeAudio,
      onStartMonitoring: input.state.onStartMonitoring,
    }),
  );
}

export function buildSimpleMonitorScreenControllerDeckRuntimeInput(
  input: UseSimpleMonitorScreenControllerSlicesInput,
  launchState: Pick<SimpleMonitorLaunchStateSlice, "isLaunchingMonitor">,
) {
  return buildSimpleMonitorDeckRuntimeInput(
    buildSimpleMonitorScreenControllerDeckHookArgs({
      state: input.state,
      isListening: input.isListening,
      isLaunchingMonitor: launchState.isLaunchingMonitor,
      collections: input.collections,
      t: input.t,
    }),
  );
}

export function buildSimpleMonitorScreenControllerSlicesResult(input: {
  launchState: SimpleMonitorLaunchStateSlice;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  anomalyFilter: SimpleMonitorAnomalyFilterStateSlice;
}) {
  return {
    launchState: buildSimpleMonitorLaunchStateSlice(input.launchState),
    deckRuntime: buildSimpleMonitorDeckRuntimeSlice(input.deckRuntime),
    anomalyFilter: input.anomalyFilter,
  };
}

export function buildSimpleMonitorScreenControllerHookArgsInput(input: {
  state: Pick<
    SimpleMonitorScreenStateInput,
    | "session"
    | "metrics"
    | "trackName"
    | "isConsoleExpanded"
    | "onToggleConsole"
    | "onStop"
    | "onResumeAudio"
    | "onReplaySession"
    | "audioStatus"
  >;
  t: AppTranslations;
  nowMs: number;
  onRefresh: () => void;
  launchState: SimpleMonitorLaunchStateSlice;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  anomalyFilter: SimpleMonitorAnomalyFilterStateSlice;
  collections: SimpleMonitorCollectionsState;
}) {
  return {
    session: input.state.session,
    metrics: input.state.metrics,
    t: input.t,
    nowMs: input.nowMs,
    trackName: input.state.trackName,
    isConsoleExpanded: input.state.isConsoleExpanded ?? false,
    onToggleConsole: input.state.onToggleConsole,
    onStop: input.state.onStop,
    onRefresh: input.onRefresh,
    onSimulateLog: input.deckRuntime.simulateLog,
    onResumeAudio: input.state.onResumeAudio,
    onReplaySession: input.state.onReplaySession,
    isAnomalyFilterActive: input.anomalyFilter.isAnomalyFilterActive,
    onToggleAnomalyFilter: input.anomalyFilter.handleToggleAnomalyFilter,
    onClearAnomalyFilter: input.anomalyFilter.handleClearAnomalyFilter,
    launchState: input.launchState,
    deckRuntime: input.deckRuntime,
    collections: input.collections,
    audioStatus: input.state.audioStatus,
  };
}

export function buildSimpleMonitorScreenControllerHookResult<TArgs>(hookStateArgs: TArgs) {
  return {
    hookStateArgs,
  };
}
