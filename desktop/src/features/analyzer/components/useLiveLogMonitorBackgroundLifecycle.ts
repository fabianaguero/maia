import { useEffect, type MutableRefObject } from "react";

import type { LibraryTrack } from "../../../types/library";
import {
  resolveBackgroundDeckLifecyclePlan,
} from "./liveLogMonitorBackgroundRuntime";
import {
  snapshotBackgroundDeckState,
  type BackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckRuntime";

export function useLiveLogMonitorBackgroundLifecycle(input: {
  liveEnabled: boolean;
  playableBaseTracks: LibraryTrack[];
  playableBaseTrackIdsKey: string;
  audioContextRef: MutableRefObject<AudioContext | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  setBackgroundNowPlayingId: (value: string | null) => void;
  setBackgroundTransitionPlan: (value: null) => void;
  stopBackgroundDeck: (fadeOutSeconds?: number) => void;
  startBackgroundDeck: (context: AudioContext, trackIndex: number) => Promise<void>;
  scheduleBackgroundTransition: (context: AudioContext, deck: BackgroundDeckState) => void;
}): void {
  const {
    liveEnabled,
    playableBaseTracks,
    playableBaseTrackIdsKey,
    audioContextRef,
    backgroundDeckRef,
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan,
    stopBackgroundDeck,
    startBackgroundDeck,
    scheduleBackgroundTransition,
  } = input;

  useEffect(() => {
    const lifecyclePlan = resolveBackgroundDeckLifecyclePlan({
      liveEnabled,
      playableBaseTracks,
      currentDeck: snapshotBackgroundDeckState(backgroundDeckRef.current),
    });

    if (lifecyclePlan.action === "suspend") {
      stopBackgroundDeck(0.12);
      if (audioContextRef.current && audioContextRef.current.state === "running") {
        void audioContextRef.current.suspend();
      }
      return;
    }

    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    if (lifecyclePlan.action === "stop") {
      stopBackgroundDeck();
      return;
    }

    if (lifecyclePlan.action === "start") {
      void startBackgroundDeck(context, lifecyclePlan.trackIndex);
      return;
    }

    if (lifecyclePlan.action === "restart") {
      stopBackgroundDeck(lifecyclePlan.fadeOutSeconds);
      void startBackgroundDeck(context, lifecyclePlan.trackIndex);
      return;
    }

    const currentDeck = backgroundDeckRef.current;
    if (!currentDeck) {
      return;
    }

    const syncedDeck = { ...currentDeck, trackIndex: lifecyclePlan.trackIndex };
    backgroundDeckRef.current = syncedDeck;
    setBackgroundNowPlayingId(lifecyclePlan.trackId);
    setBackgroundTransitionPlan(null);
    scheduleBackgroundTransition(context, syncedDeck);
  }, [
    audioContextRef,
    backgroundDeckRef,
    liveEnabled,
    playableBaseTrackIdsKey,
    playableBaseTracks,
    scheduleBackgroundTransition,
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan,
    startBackgroundDeck,
    stopBackgroundDeck,
  ]);
}
