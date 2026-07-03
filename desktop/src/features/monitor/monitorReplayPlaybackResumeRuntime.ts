import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import {
  buildReplayGuideTrackDispatch,
  clearReplayPlaybackTimerState,
  setReplayPlaybackPausedState,
  setReplayPlaybackRunningState,
} from "./monitorReplayPlaybackControlCommonRuntime";

type SetBooleanState = (value: boolean) => void;

export function resumeReplayPlaybackState(input: {
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  intervalMs: number;
  replayTick: () => void;
}): void {
  clearReplayPlaybackTimerState({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });

  if (input.replayIndexRef.current >= input.replayEventsRef.current.length) {
    input.guideTrackFinishedRef.current = false;
    const ok = buildReplayGuideTrackDispatch(input.dispatchReplayEventAtIndex)(0);
    if (!ok) {
      setReplayPlaybackPausedState({
        playbackPausedRef: input.playbackPausedRef,
        activeRef: input.activeRef,
        setIsPlaybackPaused: input.setIsPlaybackPaused,
      });
      return;
    }
  }

  setReplayPlaybackRunningState({
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
  });
  input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
}
