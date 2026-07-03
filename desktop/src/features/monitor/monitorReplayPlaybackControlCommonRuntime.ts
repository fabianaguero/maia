import type { MutableRefObject } from "react";

import { clearReplayTimer } from "./monitorReplayTickRuntime";

type SetBooleanState = (value: boolean) => void;

export function clearReplayPlaybackTimerState(input: {
  pollTimerRef: MutableRefObject<number | null>;
  clearTimeoutFn: (timer: number) => void;
}): void {
  clearReplayTimer({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });
}

export function buildReplayGuideTrackDispatch(
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean,
): (eventIndex: number) => boolean {
  return (eventIndex) => dispatchReplayEventAtIndex(eventIndex, { syncGuideTrack: true });
}

export function setReplayPlaybackPausedState(input: {
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
}): void {
  input.playbackPausedRef.current = true;
  input.activeRef.current = false;
  input.setIsPlaybackPaused(true);
}

export function setReplayPlaybackRunningState(input: {
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
}): void {
  input.playbackPausedRef.current = false;
  input.activeRef.current = true;
  input.setIsPlaybackPaused(false);
}
