import {
  buildMonitorProviderSessionApiSlice,
  buildMonitorProviderSessionAudioSlice,
  buildMonitorProviderSessionGuideTrackSlice,
  buildMonitorProviderSessionLiveSlice,
  buildMonitorProviderSessionReplaySlice,
  buildMonitorProviderSessionRuntimeSlice,
  buildMonitorProviderSessionStateSlice,
} from "./monitorProviderSessionSliceRuntime";
import type {
  BuildMonitorProviderSessionActionsInput,
  UseMonitorProviderSessionActionsInput,
} from "./monitorProviderSessionControllerTypes";

export { buildMonitorProviderSessionActionsInputFromState } from "./monitorProviderSessionControllerStateRuntime";
export type {
  BuildMonitorProviderSessionActionsInput,
  BuildMonitorProviderSessionActionsInputFromStateInput,
} from "./monitorProviderSessionControllerTypes";

export function buildMonitorProviderSessionActionsInput(
  input: BuildMonitorProviderSessionActionsInput,
): UseMonitorProviderSessionActionsInput {
  return {
    logger: input.logger,
    session: buildMonitorProviderSessionStateSlice({
      sessionRef: input.sessionRef,
      setSession: input.setSession,
      setIsPlayback: input.setIsPlayback,
      setIsPlaybackPaused: input.setIsPlaybackPaused,
      setMetrics: input.setMetrics,
      isPlayback: input.isPlayback,
    }),
    live: buildMonitorProviderSessionLiveSlice({
      activeRef: input.activeRef,
      isPlaybackRef: input.isPlaybackRef,
      directCursorRef: input.directCursorRef,
      emptyWindowsRef: input.emptyWindowsRef,
      pollTimerRef: input.pollTimerRef,
      recentUpdatesRef: input.recentUpdatesRef,
    }),
    audio: buildMonitorProviderSessionAudioSlice({
      currentSegmentRef: input.currentSegmentRef,
      audioContextRef: input.audioContextRef,
    }),
    replay: buildMonitorProviderSessionReplaySlice({
      replayEventsRef: input.replayEventsRef,
      replayMetricsRef: input.replayMetricsRef,
      replayIndexRef: input.replayIndexRef,
      replayHydratingRef: input.replayHydratingRef,
      replayHydrationTokenRef: input.replayHydrationTokenRef,
      playbackPausedRef: input.playbackPausedRef,
    }),
    guideTrack: buildMonitorProviderSessionGuideTrackSlice({
      guideTrackPathRef: input.guideTrackPathRef,
      guideTrackQueueRef: input.guideTrackQueueRef,
      guideTrackRef: input.guideTrackRef,
      guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    }),
    runtime: buildMonitorProviderSessionRuntimeSlice({
      stopPolling: input.stopPolling,
      buildLiveStartInput: input.buildLiveStartInput,
      ensureProviderAudioContext: input.ensureProviderAudioContext,
      replayTick: input.replayTick,
      syncReplayTelemetry: input.syncReplayTelemetry,
      resetReplayTelemetry: input.resetReplayTelemetry,
    }),
    api: buildMonitorProviderSessionApiSlice({
      startStreamSession: input.startStreamSession,
      stopStreamSession: input.stopStreamSession,
      listSessionEvents: input.listSessionEvents,
      updatePersistedSessionStatus: input.updatePersistedSessionStatus,
      pollLogStream: input.pollLogStream,
    }),
  };
}
