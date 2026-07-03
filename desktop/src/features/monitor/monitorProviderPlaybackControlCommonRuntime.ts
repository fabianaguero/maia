import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";

export function hasReplayEvents(replayEventsRef: MutableRefObject<SessionEvent[]>): boolean {
  return replayEventsRef.current.length > 0;
}

export function canControlMonitorPlayback(input: {
  isPlayback: boolean;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
}): boolean {
  return input.isPlayback && hasReplayEvents(input.replayEventsRef);
}

export function buildGuideTrackSynchronizedReplayDispatch(
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean,
): (eventIndex: number) => boolean {
  return (eventIndex) => dispatchReplayEventAtIndex(eventIndex, { syncGuideTrack: true });
}
