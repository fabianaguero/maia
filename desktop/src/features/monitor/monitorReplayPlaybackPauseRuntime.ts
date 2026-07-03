import type { MutableRefObject } from "react";

import {
  clearReplayPlaybackTimerState,
  setReplayPlaybackPausedState,
} from "./monitorReplayPlaybackControlCommonRuntime";

type SetBooleanState = (value: boolean) => void;

export function pauseReplayPlaybackState(input: {
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
}): void {
  clearReplayPlaybackTimerState({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });
  setReplayPlaybackPausedState({
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
  });
}
