import { useCallback } from "react";

import {
  seekMonitorPlaybackProgressState,
  seekMonitorPlaybackWindowState,
} from "./monitorProviderPlaybackControlsRuntime";
import type { UseMonitorProviderPlaybackControlsInput } from "./monitorProviderPlaybackControlTypes";

export function useMonitorProviderPlaybackSeekCallbacks(
  input: UseMonitorProviderPlaybackControlsInput,
) {
  const seekPlaybackProgress = useCallback(
    (progress: number) => {
      seekMonitorPlaybackProgressState({
        isPlayback: input.isPlayback,
        progress,
        replayEventsRef: input.replayEventsRef,
        replayIndexRef: input.replayIndexRef,
        pollTimerRef: input.pollTimerRef,
        playbackPausedRef: input.playbackPausedRef,
        activeRef: input.activeRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
        clearTimeoutFn: window.clearTimeout,
        setTimeoutFn: window.setTimeout,
        intervalMs: input.intervalMs,
        replayTick: input.replayTick,
      });
    },
    [input],
  );

  const seekPlaybackWindow = useCallback(
    (replayWindowIndex: number) => {
      seekMonitorPlaybackWindowState({
        isPlayback: input.isPlayback,
        replayWindowIndex,
        replayEventsRef: input.replayEventsRef,
        seekPlaybackProgress,
      });
    },
    [input.isPlayback, input.replayEventsRef, seekPlaybackProgress],
  );

  return {
    seekPlaybackProgress,
    seekPlaybackWindow,
  };
}
