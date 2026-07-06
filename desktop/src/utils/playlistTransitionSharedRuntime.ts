import type { BeatGridPoint, LibraryTrack } from "../types/library";

import type { PlaylistEntryPoint, PlaylistTransitionMode } from "./playlistTransitionTypes";

export function roundPlaylistMetric(value: number): number {
  return Number(value.toFixed(2));
}

export function clampPlaylistMetric(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolvePhraseSpanBeats(
  mode: PlaylistTransitionMode,
  transitionFeel: "smooth" | "steady" | "tight",
): number {
  if (mode === "cue-start") {
    return transitionFeel === "smooth" ? 16 : 8;
  }
  if (mode === "smooth-blend") {
    return transitionFeel === "tight" ? 16 : 32;
  }
  if (mode === "phrase-bridge") {
    return transitionFeel === "smooth" ? 16 : 8;
  }
  return 8;
}

export function resolvePhraseLabel(phraseSpanBeats: number): string {
  const bars = phraseSpanBeats / 4;
  return `${phraseSpanBeats}-beat / ${bars}-bar`;
}

export function findNearestBeatPoint(
  beatGrid: readonly BeatGridPoint[],
  targetSecond: number,
): BeatGridPoint | null {
  if (beatGrid.length === 0) {
    return null;
  }

  let nearest = beatGrid[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of beatGrid) {
    const distance = Math.abs(point.second - targetSecond);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function resolvePhraseBoundaryPoint(
  beatGrid: readonly BeatGridPoint[],
  targetSecond: number,
  phraseSpanBeats: number,
  durationLimit: number,
): BeatGridPoint | null {
  const phrasePoints = beatGrid.filter(
    (point) =>
      point.second >= 0 && point.second <= durationLimit && point.index % phraseSpanBeats === 0,
  );

  if (phrasePoints.length === 0) {
    return null;
  }

  const afterTarget = phrasePoints.find((point) => point.second >= targetSecond) ?? null;
  if (afterTarget && afterTarget.second - targetSecond <= 8) {
    return afterTarget;
  }

  return findNearestBeatPoint(phrasePoints, targetSecond);
}

export function resolvePhraseAlignedEntryPoint(
  track: LibraryTrack,
  entryPoint: PlaylistEntryPoint,
  phraseSpanBeats: number,
): PlaylistEntryPoint {
  const durationLimit = Math.min(track.analysis.durationSeconds ?? 45, 45);
  const phraseBoundary = resolvePhraseBoundaryPoint(
    track.analysis.beatGrid,
    entryPoint.second,
    phraseSpanBeats,
    durationLimit,
  );

  if (!phraseBoundary) {
    return entryPoint;
  }

  const nearestBeat = findNearestBeatPoint(track.analysis.beatGrid, entryPoint.second);
  const fallbackSecond =
    nearestBeat && Math.abs(nearestBeat.second - entryPoint.second) <= 2.5
      ? nearestBeat.second
      : entryPoint.second;

  const chosenSecond =
    Math.abs(phraseBoundary.second - entryPoint.second) <= 8
      ? phraseBoundary.second
      : fallbackSecond;

  if (Math.abs(chosenSecond - entryPoint.second) < 0.05) {
    return {
      second: roundPlaylistMetric(chosenSecond),
      label: entryPoint.label,
    };
  }

  return {
    second: roundPlaylistMetric(chosenSecond),
    label: `${entryPoint.label} · phrase`,
  };
}
