import type { MutableRefObject } from "react";

import { pauseReplayPlaybackState } from "./monitorPlaybackRuntime";

type SetBooleanState = (value: boolean) => void;

export function pauseMonitorPlaybackState(input: {
  isPlayback: boolean;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
}): boolean {
  if (!input.isPlayback) {
    return false;
  }

  pauseReplayPlaybackState({
    pollTimerRef: input.pollTimerRef,
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    clearTimeoutFn: input.clearTimeoutFn,
  });
  return true;
}
