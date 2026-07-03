import type { LibraryTrack } from "../types/library";

import type { PlaylistTransitionMode, PlaylistTransitionOptions } from "./playlistTransitionTypes";
import { clampPlaylistMetric, roundPlaylistMetric } from "./playlistTransitionSharedRuntime";

export function resolvePlaylistTransitionDeltas(
  currentTrack: LibraryTrack,
  nextTrack: LibraryTrack,
): { bpmDelta: number | null; energyDelta: number | null } {
  const currentBpm = currentTrack.analysis.bpm;
  const nextBpm = nextTrack.analysis.bpm;
  const bpmDelta =
    typeof currentBpm === "number" &&
    Number.isFinite(currentBpm) &&
    typeof nextBpm === "number" &&
    Number.isFinite(nextBpm)
      ? roundPlaylistMetric(Math.abs(currentBpm - nextBpm))
      : null;

  const currentEnergy = currentTrack.analysis.energyLevel;
  const nextEnergy = nextTrack.analysis.energyLevel;
  const energyDelta =
    typeof currentEnergy === "number" &&
    Number.isFinite(currentEnergy) &&
    typeof nextEnergy === "number" &&
    Number.isFinite(nextEnergy)
      ? roundPlaylistMetric(Math.abs(currentEnergy - nextEnergy))
      : null;

  return { bpmDelta, energyDelta };
}

export function resolvePlaylistTransitionMode(input: {
  bpmDelta: number | null;
  energyDelta: number | null;
  harmonicScore: number;
}): PlaylistTransitionMode {
  if (
    (input.bpmDelta ?? 999) <= 2.5 &&
    input.harmonicScore >= 2 &&
    (input.energyDelta ?? 0) <= 0.18
  ) {
    return "smooth-blend";
  }
  if (
    (input.bpmDelta ?? 999) <= 7 ||
    (input.energyDelta ?? 0) <= 0.16 ||
    input.harmonicScore >= 2
  ) {
    return "phrase-bridge";
  }
  return "reset-mix";
}

export function resolvePlaylistCrossfadeSeconds(input: {
  mode: PlaylistTransitionMode;
  options: PlaylistTransitionOptions;
}): number {
  const preferredCrossfadeSeconds = input.options.styleProfile?.playlistCrossfadeSeconds ?? 6;
  const transitionFeel = input.options.styleProfile?.transitionFeel ?? "steady";
  const transitionTightness = clampPlaylistMetric(
    input.options.mutationProfile?.transitionTightness ?? 1,
    0.7,
    1.35,
  );

  const feelMultiplier = transitionFeel === "smooth" ? 1.18 : transitionFeel === "tight" ? 0.82 : 1;
  const modeMultiplier =
    input.mode === "smooth-blend" ? 1.05 : input.mode === "phrase-bridge" ? 0.84 : 0.58;

  return roundPlaylistMetric(
    clampPlaylistMetric(
      (preferredCrossfadeSeconds * feelMultiplier * modeMultiplier) / transitionTightness,
      1.2,
      12,
    ),
  );
}
