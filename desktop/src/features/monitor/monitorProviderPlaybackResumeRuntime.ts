import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { resumeReplayPlaybackState } from "./monitorPlaybackRuntime";
import {
  buildGuideTrackSynchronizedReplayDispatch,
  canControlMonitorPlayback,
} from "./monitorProviderPlaybackControlCommonRuntime";

type SetBooleanState = (value: boolean) => void;

export function resumeMonitorPlaybackState(input: {
  isPlayback: boolean;
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
}): boolean {
  if (!canControlMonitorPlayback(input)) {
    return false;
  }

  resumeReplayPlaybackState({
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    pollTimerRef: input.pollTimerRef,
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    dispatchReplayEventAtIndex: buildGuideTrackSynchronizedReplayDispatch(
      input.dispatchReplayEventAtIndex,
    ),
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    clearTimeoutFn: input.clearTimeoutFn,
    setTimeoutFn: input.setTimeoutFn,
    intervalMs: input.intervalMs,
    replayTick: input.replayTick,
  });
  return true;
}
