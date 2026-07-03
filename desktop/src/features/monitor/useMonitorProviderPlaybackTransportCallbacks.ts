import { useCallback } from "react";

import {
  pauseMonitorPlaybackState,
  resumeMonitorPlaybackState,
  stepMonitorPlaybackWindowState,
} from "./monitorProviderPlaybackControlsRuntime";
import type { UseMonitorProviderPlaybackControlsInput } from "./monitorProviderPlaybackControlTypes";

export function useMonitorProviderPlaybackTransportCallbacks(
  input: UseMonitorProviderPlaybackControlsInput,
) {
  const pausePlayback = useCallback(() => {
    pauseMonitorPlaybackState({
      isPlayback: input.isPlayback,
      pollTimerRef: input.pollTimerRef,
      playbackPausedRef: input.playbackPausedRef,
      activeRef: input.activeRef,
      setIsPlaybackPaused: input.setIsPlaybackPaused,
      clearTimeoutFn: window.clearTimeout,
    });
  }, [input]);

  const resumePlayback = useCallback(() => {
    resumeMonitorPlaybackState({
      isPlayback: input.isPlayback,
      replayEventsRef: input.replayEventsRef,
      replayIndexRef: input.replayIndexRef,
      pollTimerRef: input.pollTimerRef,
      playbackPausedRef: input.playbackPausedRef,
      activeRef: input.activeRef,
      guideTrackFinishedRef: input.guideTrackFinishedRef,
      dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
      setIsPlaybackPaused: input.setIsPlaybackPaused,
      clearTimeoutFn: window.clearTimeout,
      setTimeoutFn: window.setTimeout,
      intervalMs: input.intervalMs,
      replayTick: input.replayTick,
    });
  }, [input]);

  const stepPlaybackWindow = useCallback(
    (direction: -1 | 1) => {
      stepMonitorPlaybackWindowState({
        isPlayback: input.isPlayback,
        direction,
        replayEventsRef: input.replayEventsRef,
        replayIndexRef: input.replayIndexRef,
        pollTimerRef: input.pollTimerRef,
        playbackPausedRef: input.playbackPausedRef,
        activeRef: input.activeRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
        setIsPlaybackPaused: input.setIsPlaybackPaused,
        clearTimeoutFn: window.clearTimeout,
      });
    },
    [input],
  );

  return {
    pausePlayback,
    resumePlayback,
    stepPlaybackWindow,
  };
}
