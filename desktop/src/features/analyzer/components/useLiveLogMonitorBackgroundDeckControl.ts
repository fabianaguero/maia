import {
  useCallback,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import {
  loadCachedBackgroundBuffer,
  type BackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckRuntime";
import {
  resolveBackgroundDeckStartPlan,
  resolveBackgroundTransitionSchedulePlan,
} from "./liveLogMonitorBackgroundRuntime";

export function useLiveLogMonitorBackgroundDeckControl(input: {
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
}): {
  clearBackgroundTransition: () => void;
  stopBackgroundDeck: (fadeOutSeconds?: number) => void;
  scheduleBackgroundTransition: (context: AudioContext, deck: BackgroundDeckState) => void;
  startBackgroundDeck: (
    context: AudioContext,
    trackIndex: number,
    transitionPlan?: PlaylistTransitionPlan | null,
  ) => Promise<void>;
  ensureBackgroundAudio: (context: AudioContext) => Promise<void>;
} {
  const clearBackgroundTransition = useCallback(() => {
    if (input.backgroundTransitionTimerRef.current !== null) {
      window.clearTimeout(input.backgroundTransitionTimerRef.current);
      input.backgroundTransitionTimerRef.current = null;
    }
  }, [input.backgroundTransitionTimerRef]);

  const stopBackgroundDeck = useEffectEvent((fadeOutSeconds = 0.18) => {
    clearBackgroundTransition();

    const context = input.audioContextRef.current;
    const deck = input.backgroundDeckRef.current;
    if (!context || !deck) {
      input.backgroundDeckRef.current = null;
      input.setBackgroundNowPlayingId(null);
      input.setBackgroundTransitionPlan(null);
      return;
    }

    const now = context.currentTime;
    deck.gain.gain.cancelScheduledValues(now);
    deck.gain.gain.setValueAtTime(Math.max(0.0001, deck.gain.gain.value), now);
    deck.gain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSeconds);
    try {
      deck.source.stop(now + fadeOutSeconds + 0.06);
    } catch {
      // ignore stop races
    }

    input.backgroundDeckRef.current = null;
    input.setBackgroundNowPlayingId(null);
    input.setBackgroundTransitionPlan(null);
  });

  const loadBackgroundBuffer = useEffectEvent(
    async (context: AudioContext, track: LibraryTrack): Promise<AudioBuffer | null> => {
      return loadCachedBackgroundBuffer({
        context,
        track,
        cache: input.backgroundBufferCacheRef.current,
        isTauriRuntime: isTauri(),
        convertFileSrc,
      });
    },
  );

  const startBackgroundDeck = useEffectEvent(
    async (
      context: AudioContext,
      trackIndex: number,
      transitionPlan?: PlaylistTransitionPlan | null,
    ) => {
      const track = input.playableBaseTracks[trackIndex] ?? null;
      if (!track) {
        return;
      }

      try {
        input.ensureBackgroundBus(context);
        const filter = input.filterNodeRef.current;
        if (!filter) {
          return;
        }

        const buffer = await loadBackgroundBuffer(context, track);
        if (!buffer) {
          return;
        }

        const previousDeck = input.backgroundDeckRef.current;
        const startAt = context.currentTime + 0.02;
        const startPlan = resolveBackgroundDeckStartPlan({
          track,
          hasPlaylistTransitions: input.playableBaseTracks.length > 1,
          styleProfile: {
            playlistCrossfadeSeconds: input.selectedStyleProfile.playlistCrossfadeSeconds,
            transitionFeel: input.selectedStyleProfile.transitionFeel,
          },
          transitionPlan,
          fallbackFadeInSeconds: 0.9,
          bufferDuration: buffer.duration,
        });
        const fadeSeconds = startPlan.fadeSeconds;
        const targetGain = input.selectedStyleProfile.backgroundGain;
        const entrySecond = startPlan.entrySecond;
        const playbackRate = startPlan.playbackRate;

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = startPlan.looping;
        source.playbackRate.setValueAtTime(playbackRate, startAt);

        const trackGain = context.createGain();
        trackGain.gain.setValueAtTime(0.0001, startAt);

        source.connect(trackGain);
        trackGain.connect(filter);
        source.start(startAt, entrySecond);
        trackGain.gain.linearRampToValueAtTime(targetGain, startAt + fadeSeconds);

        if (previousDeck) {
          previousDeck.gain.gain.cancelScheduledValues(startAt);
          previousDeck.gain.gain.setValueAtTime(
            Math.max(0.0001, previousDeck.gain.gain.value),
            startAt,
          );
          previousDeck.gain.gain.linearRampToValueAtTime(0.0001, startAt + fadeSeconds);
          try {
            previousDeck.source.stop(startAt + fadeSeconds + 0.08);
          } catch {
            // ignore stop races
          }
        }

        const nextDeck: BackgroundDeckState = {
          source,
          buffer,
          gain: trackGain,
          trackId: track.id,
          trackIndex,
          startedAtContextTime: startAt,
          bufferDurationSec: buffer.duration,
          durationSec: Math.max(0.25, (buffer.duration - entrySecond) / playbackRate),
          entrySecond,
          playbackRate,
          looping: startPlan.looping,
        };

        input.backgroundDeckRef.current = nextDeck;
        input.setBackgroundNowPlayingId(track.id);
        input.setBackgroundTransitionPlan(
          transitionPlan && transitionPlan.nextTrackId === track.id ? transitionPlan : null,
        );
        input.setBackgroundPlayheadSecond(entrySecond);
      } catch (error) {
        input.backgroundDeckRef.current = null;
        input.setBackgroundNowPlayingId(null);
        input.setBackgroundTransitionPlan(null);
        input.setRecentWarnings((current) =>
          [`Failed to start guide track: ${input.toMessage(error)}`, ...current].slice(
            0,
            input.maxRecentWarnings,
          ),
        );
      }
    },
  );

  const scheduleBackgroundTransition = useEffectEvent(
    (context: AudioContext, deck: BackgroundDeckState) => {
      clearBackgroundTransition();
      const schedulePlan = resolveBackgroundTransitionSchedulePlan({
        playableBaseTracks: input.playableBaseTracks,
        currentDeck: deck,
        styleProfile: {
          playlistCrossfadeSeconds: input.selectedStyleProfile.playlistCrossfadeSeconds,
          transitionFeel: input.selectedStyleProfile.transitionFeel,
        },
        mutationProfile: {
          transitionTightness: input.selectedMutationProfile.transitionTightness,
        },
      });

      if (schedulePlan.action !== "schedule") {
        input.setBackgroundTransitionPlan(null);
        return;
      }

      input.setBackgroundTransitionPlan(schedulePlan.transitionPlan ?? null);
      input.backgroundTransitionTimerRef.current = window.setTimeout(() => {
        void startBackgroundDeck(
          context,
          schedulePlan.trackIndex ?? 0,
          schedulePlan.transitionPlan ?? null,
        );
      }, schedulePlan.delayMs ?? 0);
    },
  );

  const ensureBackgroundAudio = useEffectEvent(async (context: AudioContext) => {
    if (input.backgroundDeckRef.current || input.playableBaseTracks.length === 0) {
      return;
    }
    await startBackgroundDeck(context, 0);
  });

  return {
    clearBackgroundTransition,
    stopBackgroundDeck,
    scheduleBackgroundTransition,
    startBackgroundDeck,
    ensureBackgroundAudio,
  };
}
