import type { AppTranslations } from "../../i18n/en";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";

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

export function buildSimpleMonitorScreenControllerHookResult<TArgs>(hookStateArgs: TArgs) {
  return {
    hookStateArgs,
  };
}
