import { convertFileSrc } from "@tauri-apps/api/core";

import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import {
  loadCachedBackgroundBuffer,
  type BackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckRuntime";
import type { UseLiveLogMonitorBackgroundDeckControlInput } from "./useLiveLogMonitorBackgroundDeckControlTypes";

export function clearBackgroundTransitionTimer(input: {
  backgroundTransitionTimerRef: UseLiveLogMonitorBackgroundDeckControlInput["backgroundTransitionTimerRef"];
  clearTimeoutFn?: typeof window.clearTimeout;
}): void {
  if (input.backgroundTransitionTimerRef.current !== null) {
    (input.clearTimeoutFn ?? window.clearTimeout)(input.backgroundTransitionTimerRef.current);
    input.backgroundTransitionTimerRef.current = null;
  }
}

export function loadBackgroundDeckBuffer(input: {
  context: AudioContext;
  track: LibraryTrack;
  cache: Map<string, Promise<AudioBuffer>>;
  isTauriRuntime: boolean;
}): Promise<AudioBuffer | null> {
  return loadCachedBackgroundBuffer({
    context: input.context,
    track: input.track,
    cache: input.cache,
    isTauriRuntime: input.isTauriRuntime,
    convertFileSrc,
  });
}

export function buildStartBackgroundDeckControllerInput(input: {
  hookInput: UseLiveLogMonitorBackgroundDeckControlInput;
  context: AudioContext;
  trackIndex: number;
  transitionPlan?: PlaylistTransitionPlan | null;
  loadBackgroundBuffer: (context: AudioContext, track: LibraryTrack) => Promise<AudioBuffer | null>;
}) {
  return {
    context: input.context,
    trackIndex: input.trackIndex,
    transitionPlan: input.transitionPlan,
    playableBaseTracks: input.hookInput.playableBaseTracks,
    styleProfile: input.hookInput.selectedStyleProfile,
    ensureBackgroundBus: input.hookInput.ensureBackgroundBus,
    getFilter: () => input.hookInput.filterNodeRef.current,
    loadBackgroundBuffer: input.loadBackgroundBuffer,
    previousDeck: input.hookInput.backgroundDeckRef.current,
    toMessage: input.hookInput.toMessage,
  };
}

export function buildScheduleBackgroundTransitionControllerInput(input: {
  hookInput: UseLiveLogMonitorBackgroundDeckControlInput;
  currentDeck: BackgroundDeckState;
  startBackgroundDeck: (
    context: AudioContext,
    trackIndex: number,
    transitionPlan?: PlaylistTransitionPlan | null,
  ) => Promise<void>;
  context: AudioContext;
}) {
  return {
    playableBaseTracks: input.hookInput.playableBaseTracks,
    currentDeck: input.currentDeck,
    styleProfile: {
      playlistCrossfadeSeconds: input.hookInput.selectedStyleProfile.playlistCrossfadeSeconds,
      transitionFeel: input.hookInput.selectedStyleProfile.transitionFeel,
    },
    mutationProfile: {
      transitionTightness: input.hookInput.selectedMutationProfile.transitionTightness,
    },
    setBackgroundTransitionPlan: input.hookInput.setBackgroundTransitionPlan,
    scheduleTimeout: (handler: () => void, delayMs: number) => window.setTimeout(handler, delayMs),
    onStartTransition: (trackIndex: number, transitionPlan: PlaylistTransitionPlan | null) => {
      void input.startBackgroundDeck(input.context, trackIndex, transitionPlan);
    },
  };
}
