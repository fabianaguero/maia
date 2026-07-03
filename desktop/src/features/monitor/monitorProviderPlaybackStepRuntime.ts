import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { stepReplayPlaybackWindowState } from "./monitorPlaybackRuntime";
import {
  buildGuideTrackSynchronizedReplayDispatch,
  canControlMonitorPlayback,
} from "./monitorProviderPlaybackControlCommonRuntime";

type SetBooleanState = (value: boolean) => void;

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
  if (!canControlMonitorPlayback(input)) {
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
    dispatchReplayEventAtIndex: buildGuideTrackSynchronizedReplayDispatch(
      input.dispatchReplayEventAtIndex,
    ),
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    clearTimeoutFn: input.clearTimeoutFn,
  });
  return true;
}
