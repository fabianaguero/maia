import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";

export interface UseLiveLogMonitorBackgroundDeckControlInput {
  audioContextRef: MutableRefObject<AudioContext | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  backgroundTransitionTimerRef: MutableRefObject<number | null>;
  backgroundBufferCacheRef: MutableRefObject<Map<string, Promise<AudioBuffer>>>;
  filterNodeRef: MutableRefObject<BiquadFilterNode | null>;
  playableBaseTracks: LibraryTrack[];
  selectedStyleProfile: {
    backgroundGain: number;
    playlistCrossfadeSeconds: number;
    transitionFeel: "smooth" | "steady" | "tight";
  };
  selectedMutationProfile: {
    transitionTightness: number;
  };
  maxRecentWarnings: number;
  ensureBackgroundBus: (context: AudioContext) => void;
  setBackgroundNowPlayingId: Dispatch<SetStateAction<string | null>>;
  setBackgroundTransitionPlan: Dispatch<SetStateAction<PlaylistTransitionPlan | null>>;
  setBackgroundPlayheadSecond: Dispatch<SetStateAction<number>>;
  setRecentWarnings: Dispatch<SetStateAction<string[]>>;
  toMessage: (error: unknown) => string;
}

export interface UseLiveLogMonitorBackgroundDeckControlResult {
  clearBackgroundTransition: () => void;
  stopBackgroundDeck: (fadeOutSeconds?: number) => void;
  scheduleBackgroundTransition: (context: AudioContext, deck: BackgroundDeckState) => void;
  startBackgroundDeck: (
    context: AudioContext,
    trackIndex: number,
    transitionPlan?: PlaylistTransitionPlan | null,
  ) => Promise<void>;
  ensureBackgroundAudio: (context: AudioContext) => Promise<void>;
}
