import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { seekReplayPlaybackState, seekReplayWindowState } from "./monitorPlaybackRuntime";
import {
  buildGuideTrackSynchronizedReplayDispatch,
  canControlMonitorPlayback,
} from "./monitorProviderPlaybackControlCommonRuntime";

export function seekMonitorPlaybackProgressState(input: {
  isPlayback: boolean;
  progress: number;
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
  clearTimeoutFn: (timer: number) => void;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  intervalMs: number;
  replayTick: () => void;
}): boolean {
  if (!canControlMonitorPlayback(input)) {
    return false;
  }

  seekReplayPlaybackState({
    progress: input.progress,
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    pollTimerRef: input.pollTimerRef,
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    dispatchReplayEventAtIndex: buildGuideTrackSynchronizedReplayDispatch(
      input.dispatchReplayEventAtIndex,
    ),
    clearTimeoutFn: input.clearTimeoutFn,
    setTimeoutFn: input.setTimeoutFn,
    intervalMs: input.intervalMs,
    replayTick: input.replayTick,
  });
  return true;
}

export function seekMonitorPlaybackWindowState(input: {
  isPlayback: boolean;
  replayWindowIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  seekPlaybackProgress: (progress: number) => void;
}): boolean {
  if (!canControlMonitorPlayback(input)) {
    return false;
  }

  seekReplayWindowState({
    replayWindowIndex: input.replayWindowIndex,
    replayEventsRef: input.replayEventsRef,
    seekPlaybackProgress: input.seekPlaybackProgress,
  });
  return true;
}
