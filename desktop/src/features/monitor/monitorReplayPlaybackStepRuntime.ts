import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { resolveSteppedReplayIndex } from "../../utils/replay";
import {
  buildReplayGuideTrackDispatch,
  clearReplayPlaybackTimerState,
  setReplayPlaybackPausedState,
} from "./monitorReplayPlaybackControlCommonRuntime";

type SetBooleanState = (value: boolean) => void;

export function stepReplayPlaybackWindowState(input: {
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
  input.guideTrackFinishedRef.current = false;

  const targetIndex = resolveSteppedReplayIndex(
    input.replayIndexRef.current,
    input.replayEventsRef.current.length,
    input.direction,
  );
  void buildReplayGuideTrackDispatch(input.dispatchReplayEventAtIndex)(targetIndex);
}
