import { buildSimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorScreenControllerCollectionsInput,
  type UseSimpleMonitorScreenControllerSlicesInput,
} from "./simpleMonitorScreenControllerHookRuntime";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";

export function buildSimpleMonitorScreenControllerState(
  input: SimpleMonitorScreenStateInput,
): SimpleMonitorScreenStateInput {
  return {
    skin: input.skin,
    session: input.session,
    metrics: input.metrics,
    pastSessions: input.pastSessions,
    repositories: input.repositories,
    tracks: input.tracks,
    onStop: input.onStop,
    onResumeAudio: input.onResumeAudio,
    audioStatus: input.audioStatus,
    audioContext: input.audioContext,
    onStartMonitoring: input.onStartMonitoring,
    onReplaySession: input.onReplaySession,
    onDeletePastSession: input.onDeletePastSession,
    onDeleteLibraryTrack: input.onDeleteLibraryTrack,
    subscribe: input.subscribe,
    trackName: input.trackName,
    waveformBins: input.waveformBins,
    isConsoleExpanded: input.isConsoleExpanded ?? false,
    onToggleConsole: input.onToggleConsole,
    liveSettings: input.liveSettings,
  };
}

export function buildSimpleMonitorScreenControllerCollections(
  input: Pick<SimpleMonitorScreenStateInput, "pastSessions" | "repositories" | "tracks">,
) {
  return buildSimpleMonitorCollectionsState(
    buildSimpleMonitorScreenControllerCollectionsInput(input),
  );
}

export function buildSimpleMonitorScreenControllerSlicesInput(input: {
  state: SimpleMonitorScreenStateInput;
  collections: UseSimpleMonitorScreenControllerSlicesInput["collections"];
  isListening: boolean;
  t: UseSimpleMonitorScreenControllerSlicesInput["t"];
}): UseSimpleMonitorScreenControllerSlicesInput {
  return {
    state: input.state,
    collections: input.collections,
    isListening: input.isListening,
    t: input.t,
  };
}
