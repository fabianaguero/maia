import { useEffect, useRef } from "react";

import type { LibraryTrack } from "../../types/library";

interface UseSimpleMonitorDeckLiveRefsInput {
  activeTrack: LibraryTrack | null;
  deckDurationSeconds: number | null;
}

export function useSimpleMonitorDeckLiveRefs({
  activeTrack,
  deckDurationSeconds,
}: UseSimpleMonitorDeckLiveRefsInput) {
  const activeTrackRef = useRef(activeTrack);
  const deckDurationSecondsRef = useRef(deckDurationSeconds);

  useEffect(() => {
    activeTrackRef.current = activeTrack;
  }, [activeTrack]);

  useEffect(() => {
    deckDurationSecondsRef.current = deckDurationSeconds;
  }, [deckDurationSeconds]);

  return {
    activeTrackRef,
    deckDurationSecondsRef,
  };
}
