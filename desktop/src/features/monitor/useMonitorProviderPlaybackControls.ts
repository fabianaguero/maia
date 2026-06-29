import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import {
  pauseMonitorPlaybackState,
  resumeMonitorPlaybackState,
  seekMonitorPlaybackProgressState,
  seekMonitorPlaybackWindowState,
  stepMonitorPlaybackWindowState,
} from "./monitorProviderPlaybackControlsRuntime";

export interface UseMonitorProviderPlaybackControlsInput {
  isPlayback: boolean;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (eventIndex: number) => boolean;
  replayTick: () => void;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  intervalMs: number;
}

export function useMonitorProviderPlaybackControls(
  input: UseMonitorProviderPlaybackControlsInput,
) {
  const seekPlaybackProgress = useCallback((progress: number) => {
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
  }, [input]);

  const seekPlaybackWindow = useCallback((replayWindowIndex: number) => {
    seekMonitorPlaybackWindowState({
      isPlayback: input.isPlayback,
      replayWindowIndex,
      replayEventsRef: input.replayEventsRef,
      seekPlaybackProgress,
    });
  }, [input.isPlayback, input.replayEventsRef, seekPlaybackProgress]);

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

  const stepPlaybackWindow = useCallback((direction: -1 | 1) => {
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
  }, [input]);

  return {
    seekPlaybackProgress,
    seekPlaybackWindow,
    pausePlayback,
    resumePlayback,
    stepPlaybackWindow,
  };
}
