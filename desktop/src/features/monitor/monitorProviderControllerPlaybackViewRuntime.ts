import type { MonitorProviderStateViewModel } from "./monitorProviderControllerStateTypes";
import type { UseMonitorProviderPlaybackControlsInput } from "./monitorProviderPlaybackControlTypes";

export function buildMonitorProviderPlaybackControlsInput(input: {
  state: MonitorProviderStateViewModel;
  orchestration: {
    dispatchReplayEventAtIndex: UseMonitorProviderPlaybackControlsInput["dispatchReplayEventAtIndex"];
    replayTick: UseMonitorProviderPlaybackControlsInput["replayTick"];
  };
  intervalMs: number;
}): UseMonitorProviderPlaybackControlsInput {
  return {
    isPlayback: input.state.isPlayback,
    replayEventsRef: input.state.replayEventsRef,
    replayIndexRef: input.state.replayIndexRef,
    pollTimerRef: input.state.pollTimerRef,
    playbackPausedRef: input.state.playbackPausedRef,
    activeRef: input.state.activeRef,
    guideTrackFinishedRef: input.state.guideTrackFinishedRef,
    dispatchReplayEventAtIndex: input.orchestration.dispatchReplayEventAtIndex,
    replayTick: input.orchestration.replayTick,
    setIsPlaybackPaused: input.state.setIsPlaybackPaused,
    intervalMs: input.intervalMs,
  };
}
