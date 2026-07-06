import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { resolveReplayProgressForWindow, resolveReplayTargetIndex } from "../../utils/replay";
import {
  buildReplayGuideTrackDispatch,
  clearReplayPlaybackTimerState,
} from "./monitorReplayPlaybackControlCommonRuntime";

export function seekReplayPlaybackState(input: {
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
}): void {
  clearReplayPlaybackTimerState({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });

  const targetIndex = resolveReplayTargetIndex(
    input.progress,
    input.replayEventsRef.current.length,
  );
  input.activeRef.current = true;
  input.guideTrackFinishedRef.current = false;
  const ok = buildReplayGuideTrackDispatch(input.dispatchReplayEventAtIndex)(targetIndex);
  if (!ok) {
    return;
  }

  if (input.activeRef.current && !input.playbackPausedRef.current) {
    input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
  }
}

export function seekReplayWindowState(input: {
  replayWindowIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  seekPlaybackProgress: (progress: number) => void;
}): void {
  input.seekPlaybackProgress(
    resolveReplayProgressForWindow(input.replayWindowIndex, input.replayEventsRef.current.length),
  );
}
