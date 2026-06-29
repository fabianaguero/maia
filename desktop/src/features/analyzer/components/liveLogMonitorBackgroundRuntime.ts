import type { LibraryTrack } from "../../../types/library";
import type { StyleProfileOption } from "../../../types/music";
import { resolveNextPlaylistIndex } from "../../../utils/playlistRuntime";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import {
  resolvePhraseAlignedTransitionDelayMs,
  resolvePlaylistStartPlan,
  resolvePlaylistTransitionPlan,
} from "../../../utils/playlistTransition";

export interface BackgroundDeckSnapshot {
  trackId: string;
  trackIndex: number;
  looping: boolean;
  entrySecond: number;
  playbackRate: number;
  durationSec: number;
}

export type BackgroundDeckLifecyclePlan =
  | { action: "suspend" }
  | { action: "stop" }
  | { action: "start"; trackIndex: number }
  | { action: "restart"; trackIndex: number; fadeOutSeconds: number }
  | { action: "sync"; trackId: string; trackIndex: number };

export function resolveBackgroundDeckLifecyclePlan(input: {
  liveEnabled: boolean;
  playableBaseTracks: LibraryTrack[];
  currentDeck: BackgroundDeckSnapshot | null;
}): BackgroundDeckLifecyclePlan {
  if (!input.liveEnabled) {
    return { action: "suspend" };
  }

  if (input.playableBaseTracks.length === 0) {
    return { action: "stop" };
  }

  if (input.playableBaseTracks.length === 1) {
    const onlyTrack = input.playableBaseTracks[0];
    if (
      !input.currentDeck ||
      input.currentDeck.trackId !== onlyTrack.id ||
      input.currentDeck.looping !== true
    ) {
      return { action: "restart", trackIndex: 0, fadeOutSeconds: 0.1 };
    }

    return { action: "sync", trackId: onlyTrack.id, trackIndex: 0 };
  }

  if (!input.currentDeck) {
    return { action: "start", trackIndex: 0 };
  }

  const currentIndex = input.playableBaseTracks.findIndex(
    (track) => track.id === input.currentDeck?.trackId,
  );
  if (currentIndex === -1) {
    return { action: "restart", trackIndex: 0, fadeOutSeconds: 0.1 };
  }

  return {
    action: "sync",
    trackId: input.currentDeck.trackId,
    trackIndex: currentIndex,
  };
}

export interface BackgroundTransitionSchedulePlan {
  action: "clear" | "schedule";
  trackIndex?: number;
  transitionPlan?: PlaylistTransitionPlan | null;
  delayMs?: number;
}

export function resolveBackgroundTransitionSchedulePlan(input: {
  playableBaseTracks: LibraryTrack[];
  currentDeck: Pick<
    BackgroundDeckSnapshot,
    "trackIndex" | "entrySecond" | "playbackRate" | "durationSec"
  >;
  styleProfile: Pick<StyleProfileOption, "playlistCrossfadeSeconds" | "transitionFeel">;
  mutationProfile: {
    transitionTightness: number;
  };
}): BackgroundTransitionSchedulePlan {
  if (input.playableBaseTracks.length <= 1) {
    return { action: "clear" };
  }

  const currentTrack = input.playableBaseTracks[input.currentDeck.trackIndex] ?? null;
  const nextIndex = resolveNextPlaylistIndex(
    input.currentDeck.trackIndex,
    input.playableBaseTracks.length,
  );
  if (!currentTrack || nextIndex === null) {
    return { action: "clear" };
  }

  const nextTrack = input.playableBaseTracks[nextIndex] ?? null;
  if (!nextTrack) {
    return { action: "clear" };
  }

  const transitionPlan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
    styleProfile: input.styleProfile,
    mutationProfile: input.mutationProfile,
  });

  const delayMs = resolvePhraseAlignedTransitionDelayMs({
    track: currentTrack,
    entrySecond: input.currentDeck.entrySecond,
    playbackRate: input.currentDeck.playbackRate,
    crossfadeSeconds: transitionPlan.crossfadeSeconds,
    phraseSpanBeats: transitionPlan.phraseSpanBeats,
    fallbackDurationSeconds: input.currentDeck.durationSec,
  });

  return {
    action: "schedule",
    trackIndex: nextIndex,
    transitionPlan,
    delayMs,
  };
}

export function resolveBackgroundDeckStartPlan(input: {
  track: LibraryTrack;
  hasPlaylistTransitions: boolean;
  styleProfile: Pick<StyleProfileOption, "playlistCrossfadeSeconds" | "transitionFeel">;
  transitionPlan?: PlaylistTransitionPlan | null;
  fallbackFadeInSeconds: number;
  bufferDuration: number;
}): {
  transitionPlan: PlaylistTransitionPlan;
  fadeSeconds: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
} {
  const nextTransitionPlan =
    input.transitionPlan ??
    (input.hasPlaylistTransitions
      ? resolvePlaylistStartPlan(input.track, {
          styleProfile: input.styleProfile,
        })
      : resolvePlaylistStartPlan(input.track, {
          styleProfile: {
            playlistCrossfadeSeconds: input.fallbackFadeInSeconds,
            transitionFeel: "steady",
          },
        }));

  return {
    transitionPlan: nextTransitionPlan,
    fadeSeconds: input.hasPlaylistTransitions
      ? Math.max(0.4, nextTransitionPlan.crossfadeSeconds)
      : input.fallbackFadeInSeconds,
    entrySecond: input.hasPlaylistTransitions
      ? Math.min(nextTransitionPlan.entrySecond, Math.max(0, input.bufferDuration - 0.25))
      : 0,
    playbackRate: input.hasPlaylistTransitions ? nextTransitionPlan.tempoRatio : 1,
    looping: !input.hasPlaylistTransitions,
  };
}
