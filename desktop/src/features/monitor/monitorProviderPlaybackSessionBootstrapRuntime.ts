import {
  activatePreparedPlaybackMonitorSessionState,
  finalizePlaybackMonitorSessionSetupState,
} from "./monitorPlaybackSessionRuntime";
import { maybeHydratePlaybackReplayState } from "./monitorReplayHydrationRuntime";
import type { ActivateAndBootstrapPlaybackSessionStateInput } from "./monitorProviderPlaybackSessionTypes";

export async function activateAndBootstrapPlaybackSessionState(
  input: ActivateAndBootstrapPlaybackSessionStateInput,
): Promise<number> {
  const hydrationToken = activatePreparedPlaybackMonitorSessionState({
    prepared: input.prepared,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    syncReplayTelemetry: input.syncReplayTelemetry,
  });

  await finalizePlaybackMonitorSessionSetupState({
    ensureAudioContext: input.ensureAudioContext,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    awaitGuideTrack: input.awaitGuideTrack,
    replayTick: () => {
      if (input.pollTimerRef.current !== null) {
        window.clearTimeout(input.pollTimerRef.current);
      }
      input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, 120);
    },
    logger: input.logger,
  });

  maybeHydratePlaybackReplayState({
    prepared: input.prepared,
    hydrationToken,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    sessionRef: input.sessionRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    activeRef: input.activeRef,
    playbackPausedRef: input.playbackPausedRef,
    pollTimerRef: input.pollTimerRef,
    syncReplayTelemetry: input.syncReplayTelemetry,
    rebuildReplayEventsFromSource: input.rebuildReplayEventsFromSource,
    setTimeoutFn: input.setTimeoutFn,
    replayTick: input.replayTick,
    logger: input.logger,
  });

  return hydrationToken;
}
