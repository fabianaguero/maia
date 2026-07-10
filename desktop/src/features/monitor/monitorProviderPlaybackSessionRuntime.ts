import { preparePlaybackMonitorSessionState } from "./monitorPlaybackSessionRuntime";
import { activateAndBootstrapPlaybackSessionState } from "./monitorProviderPlaybackSessionBootstrapRuntime";
import type { StartMonitorProviderPlaybackSessionStateInput } from "./monitorProviderPlaybackSessionTypes";

export { activateAndBootstrapPlaybackSessionState };
export type {
  ActivateAndBootstrapPlaybackSessionStateInput,
  MonitorProviderPlaybackSessionSharedStateInput,
  StartMonitorProviderPlaybackSessionStateInput,
} from "./monitorProviderPlaybackSessionTypes";

export async function startMonitorProviderPlaybackSessionState(
  input: StartMonitorProviderPlaybackSessionStateInput,
): Promise<boolean> {
  if (input.sessionRef.current) {
    input.stopPolling();
    input.sessionRef.current = null;
  }

  const prepared = await preparePlaybackMonitorSessionState({
    sessionId: input.sessionId,
    label: input.label,
    sourcePath: input.sourcePath,
    repoId: input.repoId,
    trackId: input.trackId,
    trackTitle: input.trackTitle,
    loadSessionEvents: input.loadSessionEvents,
    logger: input.logger,
  });
  if (!prepared) {
    return false;
  }

  await activateAndBootstrapPlaybackSessionState({
    prepared,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    pollTimerRef: input.pollTimerRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    syncReplayTelemetry: input.syncReplayTelemetry,
    ensureAudioContext: input.ensureAudioContext,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    awaitGuideTrack: input.awaitGuideTrack,
    replayTick: input.replayTick,
    rebuildReplayEventsFromSource: input.rebuildReplayEventsFromSource,
    setTimeoutFn: input.setTimeoutFn,
    logger: input.logger,
  });

  return true;
}
