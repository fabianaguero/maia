import { rebuildReplayEventsFromSource } from "./monitorReplayRuntime";
import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import type { StartMonitorProviderPlaybackSessionStateInput } from "./monitorProviderPlaybackSessionRuntime";

export function buildMonitorProviderPlaybackSessionInput(input: {
  selection: PlaybackSessionSelection;
  dependencies: Pick<
    UseMonitorProviderSessionActionsInput,
    "logger" | "session" | "live" | "replay" | "guideTrack" | "runtime" | "api"
  >;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
}): StartMonitorProviderPlaybackSessionStateInput {
  const { dependencies, selection, setTimeoutFn } = input;

  return {
    ...selection,
    sessionRef: dependencies.session.sessionRef,
    stopPolling: dependencies.runtime.stopPolling,
    loadSessionEvents: dependencies.api.listSessionEvents,
    activeRef: dependencies.live.activeRef,
    isPlaybackRef: dependencies.live.isPlaybackRef,
    playbackPausedRef: dependencies.replay.playbackPausedRef,
    replayEventsRef: dependencies.replay.replayEventsRef,
    replayMetricsRef: dependencies.replay.replayMetricsRef,
    replayIndexRef: dependencies.replay.replayIndexRef,
    replayHydratingRef: dependencies.replay.replayHydratingRef,
    replayHydrationTokenRef: dependencies.replay.replayHydrationTokenRef,
    pollTimerRef: dependencies.live.pollTimerRef,
    setSession: dependencies.session.setSession,
    setIsPlayback: dependencies.session.setIsPlayback,
    setIsPlaybackPaused: dependencies.session.setIsPlaybackPaused,
    setMetrics: dependencies.session.setMetrics,
    syncReplayTelemetry: dependencies.runtime.syncReplayTelemetry,
    ensureAudioContext: dependencies.runtime.ensureProviderAudioContext,
    guideTrackPathRef: dependencies.guideTrack.guideTrackPathRef,
    guideTrackQueueRef: dependencies.guideTrack.guideTrackQueueRef,
    guideTrackRef: dependencies.guideTrack.guideTrackRef,
    guideTrackLoadPromiseRef: dependencies.guideTrack.guideTrackLoadPromiseRef,
    awaitGuideTrack: async () =>
      dependencies.guideTrack.guideTrackLoadPromiseRef.current
        ? dependencies.guideTrack.guideTrackLoadPromiseRef.current
        : undefined,
    replayTick: dependencies.runtime.replayTick,
    rebuildReplayEventsFromSource: ({ sessionId, sourcePath }) =>
      rebuildReplayEventsFromSource({
        sessionId,
        sourcePath,
        pollLogStream: dependencies.api.pollLogStream,
      }),
    setTimeoutFn,
    logger: dependencies.logger,
  };
}
