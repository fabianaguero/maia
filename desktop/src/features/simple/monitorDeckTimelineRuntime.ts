import type { BeatGridPoint } from "../../types/library";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatDeckTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "--:--";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function resolveBeatDurationSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): number {
  if (beatGrid && beatGrid.length > 1) {
    const spacing = beatGrid[1]!.second - beatGrid[0]!.second;
    if (spacing > 0 && Number.isFinite(spacing)) {
      return spacing;
    }
  }

  if (typeof bpm === "number" && Number.isFinite(bpm) && bpm > 0) {
    return 60 / bpm;
  }

  return 60 / 124;
}

export function resolveVisibleWindowSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): number {
  return Math.max(6, Math.min(18, resolveBeatDurationSeconds(bpm, beatGrid) * 16));
}

export function quantizeProgressToBeatGrid(
  progress: number,
  durationSeconds: number | null | undefined,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  subdivision = 0.25,
): number {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return clamp01(progress);
  }

  const currentSecond = clamp01(progress) * durationSeconds;
  const beatDuration = resolveBeatDurationSeconds(bpm, beatGrid);
  const gridStep = Math.max(0.05, beatDuration * subdivision);
  const quantizedSecond = Math.round(currentSecond / gridStep) * gridStep;
  return clamp01(quantizedSecond / durationSeconds);
}

export function buildDeckTimelineMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  markerCount = 7,
): Array<{
  id: string;
  leftPercent: number;
  label: string;
  emphasis: "major" | "minor" | "playhead";
}> {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return [];
  }

  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const halfWindowSeconds = visibleWindowSeconds / 2;
  const centerSecond = clamp01(progress) * durationSeconds;
  const startSecond = Math.max(0, centerSecond - halfWindowSeconds);
  const endSecond = Math.min(durationSeconds, centerSecond + halfWindowSeconds);
  const visibleSpan = Math.max(1, endSecond - startSecond);
  const step = visibleSpan / (markerCount - 1);

  return Array.from({ length: markerCount }, (_, index) => {
    const second = Math.min(durationSeconds, startSecond + step * index);
    const leftPercent = ((second - startSecond) / visibleSpan) * 100;
    const emphasis =
      index === Math.floor(markerCount / 2) ? "playhead" : index % 2 === 0 ? "major" : "minor";
    return {
      id: `deck-marker-${index}-${second.toFixed(2)}`,
      leftPercent,
      label: formatDeckTime(second),
      emphasis,
    };
  });
}

export function buildDeckBeatMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): Array<{ id: string; leftPercent: number; major: boolean }> {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return [];
  }

  const beatDuration = resolveBeatDurationSeconds(bpm, beatGrid);
  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const halfWindowSeconds = visibleWindowSeconds / 2;
  const centerSecond = clamp01(progress) * durationSeconds;
  const startSecond = Math.max(0, centerSecond - halfWindowSeconds);
  const endSecond = Math.min(durationSeconds, centerSecond + halfWindowSeconds);
  const visibleSpan = Math.max(1, endSecond - startSecond);

  const beats =
    beatGrid && beatGrid.length > 0
      ? beatGrid.filter((beat) => beat.second >= startSecond && beat.second <= endSecond)
      : Array.from({ length: Math.ceil(visibleSpan / beatDuration) + 2 }, (_, index) => ({
          index,
          second: startSecond + index * beatDuration,
        })).filter((beat) => beat.second <= endSecond);

  return beats.map((beat, index) => ({
    id: `deck-beat-${beat.index}-${beat.second.toFixed(3)}`,
    leftPercent: ((beat.second - startSecond) / visibleSpan) * 100,
    major: (beat.index ?? index) % 4 === 0,
  }));
}
