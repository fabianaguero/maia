import type { BeatGridPoint } from "../types/library";

export function formatTrackTime(seconds: number | null, pendingLabel = "Pending"): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return pendingLabel;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
}

export function snapTrackSecond(second: number, durationSeconds: number | null): number {
  const clamped =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? Math.min(Math.max(0, second), durationSeconds)
      : Math.max(0, second);

  return Number(clamped.toFixed(3));
}

export function hasUsableBeatGrid(beatGrid: readonly BeatGridPoint[]): boolean {
  return beatGrid.length > 1;
}

export function findNearestBeatGridSecond(
  second: number,
  beatGrid: readonly BeatGridPoint[],
): number | null {
  if (!hasUsableBeatGrid(beatGrid)) {
    return null;
  }

  let nearestSecond = beatGrid[0]?.second ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of beatGrid) {
    const distance = Math.abs(point.second - second);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSecond = point.second;
    }
  }

  return nearestSecond;
}

export function resolveTrackPlacementSecond(
  second: number,
  durationSeconds: number | null,
  beatGrid: readonly BeatGridPoint[],
  quantizeEnabled: boolean,
): number {
  const normalizedSecond = snapTrackSecond(second, durationSeconds);
  if (!quantizeEnabled) {
    return normalizedSecond;
  }

  const beatGridSecond = findNearestBeatGridSecond(normalizedSecond, beatGrid);
  return beatGridSecond === null
    ? normalizedSecond
    : snapTrackSecond(beatGridSecond, durationSeconds);
}

function beatDurationSeconds(bpm: number | null): number | null {
  if (typeof bpm !== "number" || Number.isNaN(bpm) || bpm <= 0) {
    return null;
  }

  return 60 / bpm;
}

export function minimumTrackLoopSpanSeconds(bpm: number | null): number {
  return beatDurationSeconds(bpm) ?? 0.05;
}

export function resolveTrackBeatDurationSeconds(
  beatGrid: readonly BeatGridPoint[],
  bpm: number | null = null,
): number | null {
  if (beatGrid.length > 1) {
    const spacing = beatGrid[1]!.second - beatGrid[0]!.second;
    if (spacing > 0 && Number.isFinite(spacing)) {
      return spacing;
    }
  }

  return beatDurationSeconds(bpm);
}

export function canCreateBeatLoop(
  bpm: number | null,
  startSecond: number,
  beatCount: number,
  durationSeconds: number | null,
): boolean {
  const secondsPerBeat = beatDurationSeconds(bpm);
  if (secondsPerBeat === null || beatCount <= 0) {
    return false;
  }

  const normalizedStart = snapTrackSecond(startSecond, durationSeconds);
  const normalizedEnd = snapTrackSecond(
    normalizedStart + secondsPerBeat * beatCount,
    durationSeconds,
  );

  return normalizedEnd > normalizedStart;
}

export function nudgeTrackSecond(
  second: number,
  direction: -1 | 1,
  options: {
    durationSeconds: number | null;
    beatGrid: readonly BeatGridPoint[];
    bpm?: number | null;
    coarse?: boolean;
    freeSlip?: boolean;
  },
): number {
  const beatDuration = resolveTrackBeatDurationSeconds(options.beatGrid, options.bpm ?? null);
  const deltaSeconds = options.freeSlip
    ? 0.02
    : beatDuration !== null
      ? beatDuration * (options.coarse ? 4 : 1)
      : options.coarse
        ? 0.25
        : 0.05;

  const nextSecond = second + direction * deltaSeconds;
  if (options.freeSlip) {
    return snapTrackSecond(nextSecond, options.durationSeconds);
  }

  return resolveTrackPlacementSecond(
    nextSecond,
    options.durationSeconds,
    options.beatGrid,
    hasUsableBeatGrid(options.beatGrid),
  );
}
