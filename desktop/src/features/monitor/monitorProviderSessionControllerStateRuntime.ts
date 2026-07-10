import { buildMonitorProviderSessionActionsInput } from "./monitorProviderSessionControllerRuntime";
import type { BuildMonitorProviderSessionActionsInputFromStateInput } from "./monitorProviderSessionControllerTypes";

export function buildMonitorProviderSessionActionsInputFromState(
  input: BuildMonitorProviderSessionActionsInputFromStateInput,
) {
  const { state } = input;

  return buildMonitorProviderSessionActionsInput({
    logger: input.logger,
    sessionRef: state.sessionRef,
    setSession: state.setSession,
    setIsPlayback: state.setIsPlayback,
    setIsPlaybackPaused: state.setIsPlaybackPaused,
    setMetrics: state.setMetrics,
    isPlayback: state.isPlayback,
    activeRef: state.activeRef,
    isPlaybackRef: state.isPlaybackRef,
    directCursorRef: state.directCursorRef,
    emptyWindowsRef: state.emptyWindowsRef,
    recentUpdatesRef: state.recentUpdatesRef,
    currentSegmentRef: state.currentSegmentRef,
    audioContextRef: state.audioContextRef,
    replayEventsRef: state.replayEventsRef,
    replayMetricsRef: state.replayMetricsRef,
    replayIndexRef: state.replayIndexRef,
    replayHydratingRef: state.replayHydratingRef,
    replayHydrationTokenRef: state.replayHydrationTokenRef,
    playbackPausedRef: state.playbackPausedRef,
    pollTimerRef: state.pollTimerRef,
    guideTrackPathRef: state.guideTrackPathRef,
    guideTrackQueueRef: state.guideTrackQueueRef,
    guideTrackRef: state.guideTrackRef,
    guideTrackLoadPromiseRef: state.guideTrackLoadPromiseRef,
    stopPolling: input.stopPolling,
    buildLiveStartInput: input.buildLiveStartInput,
    ensureProviderAudioContext: input.ensureProviderAudioContext,
    replayTick: input.replayTick,
    syncReplayTelemetry: input.syncReplayTelemetry,
    resetReplayTelemetry: input.resetReplayTelemetry,
    startStreamSession: input.startStreamSession,
    stopStreamSession: input.stopStreamSession,
    listSessionEvents: input.listSessionEvents,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    pollLogStream: input.pollLogStream,
  });
}
