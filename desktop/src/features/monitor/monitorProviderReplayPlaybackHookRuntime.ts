import { POLL_INTERVAL_MS } from "./monitorSessionRuntime";
import type { UseMonitorProviderReplayPlaybackRuntimeInput } from "./useMonitorProviderReplayPlaybackRuntimeTypes";

export function buildMonitorProviderDispatchReplayEventAtIndexHookInput(
  input: UseMonitorProviderReplayPlaybackRuntimeInput,
  eventIndex: number,
  syncGuideTrack?: boolean,
) {
  return {
    eventIndex,
    replayEventsRef: input.input.playback.replayEventsRef,
    replayIndexRef: input.input.playback.replayIndexRef,
    sessionRef: input.input.session.sessionRef,
    emitUpdate: input.emitUpdate,
    syncReplayTelemetry: input.syncReplayTelemetry,
    syncGuideTrackToReplayProgress: input.syncGuideTrackToReplayProgress,
    syncGuideTrack,
  };
}

export function buildMonitorProviderReplayTickHookInput(input: {
  runtimeInput: UseMonitorProviderReplayPlaybackRuntimeInput;
  dispatchReplayEventAtIndex: (eventIndex: number) => boolean;
  replayTick: () => void;
  stopAllMonitorAudio: () => void;
}) {
  return {
    activeRef: input.runtimeInput.input.live.activeRef,
    playbackPausedRef: input.runtimeInput.input.playback.playbackPausedRef,
    replayEventsRef: input.runtimeInput.input.playback.replayEventsRef,
    replayIndexRef: input.runtimeInput.input.playback.replayIndexRef,
    replayHydratingRef: input.runtimeInput.input.playback.replayHydratingRef,
    pollTimerRef: input.runtimeInput.input.live.pollTimerRef,
    intervalMs: POLL_INTERVAL_MS,
    dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
    syncReplayTelemetry: input.runtimeInput.syncReplayTelemetry,
    setIsPlaybackPaused: input.runtimeInput.input.playback.setIsPlaybackPaused,
    stopAllMonitorAudio: input.stopAllMonitorAudio,
    logger: input.runtimeInput.input.logger,
    replayTick: input.replayTick,
  };
}
