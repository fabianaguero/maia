import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";

export interface UseMonitorProviderPlaybackControlsInput {
  isPlayback: boolean;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (eventIndex: number) => boolean;
  replayTick: () => void;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  intervalMs: number;
}
