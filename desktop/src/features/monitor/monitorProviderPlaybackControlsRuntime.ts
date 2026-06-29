import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import {
  pauseReplayPlaybackState,
  resumeReplayPlaybackState,
  seekReplayPlaybackState,
  seekReplayWindowState,
  stepReplayPlaybackWindowState,
} from "./monitorPlaybackRuntime";

type SetBooleanState = (value: boolean) => void;

export function hasReplayEvents(replayEventsRef: MutableRefObject<SessionEvent[]>): boolean {
  return replayEventsRef.current.length > 0;
}

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
  if (!input.isPlayback || !hasReplayEvents(input.replayEventsRef)) {
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
    dispatchReplayEventAtIndex: (eventIndex) =>
      input.dispatchReplayEventAtIndex(eventIndex, { syncGuideTrack: true }),
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
  if (!input.isPlayback || !hasReplayEvents(input.replayEventsRef)) {
    return false;
  }

  seekReplayWindowState({
    replayWindowIndex: input.replayWindowIndex,
    replayEventsRef: input.replayEventsRef,
    seekPlaybackProgress: input.seekPlaybackProgress,
  });
  return true;
}

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
  if (!input.isPlayback || !hasReplayEvents(input.replayEventsRef)) {
    return false;
  }

  resumeReplayPlaybackState({
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    pollTimerRef: input.pollTimerRef,
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    dispatchReplayEventAtIndex: (eventIndex) =>
      input.dispatchReplayEventAtIndex(eventIndex, { syncGuideTrack: true }),
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    clearTimeoutFn: input.clearTimeoutFn,
    setTimeoutFn: input.setTimeoutFn,
    intervalMs: input.intervalMs,
    replayTick: input.replayTick,
  });
  return true;
}

export function stepMonitorPlaybackWindowState(input: {
  isPlayback: boolean;
  direction: -1 | 1;
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
}): boolean {
  if (!input.isPlayback || !hasReplayEvents(input.replayEventsRef)) {
    return false;
  }

  stepReplayPlaybackWindowState({
    direction: input.direction,
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    pollTimerRef: input.pollTimerRef,
    playbackPausedRef: input.playbackPausedRef,
    activeRef: input.activeRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    dispatchReplayEventAtIndex: (eventIndex) =>
      input.dispatchReplayEventAtIndex(eventIndex, { syncGuideTrack: true }),
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    clearTimeoutFn: input.clearTimeoutFn,
  });
  return true;
}
