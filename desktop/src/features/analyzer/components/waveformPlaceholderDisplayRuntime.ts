import type { BeatGridPoint } from "../../../types/library";
import { deriveBeatGridGuideMarkers } from "../../../utils/beatGrid";

export function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function resolveDisplayBins(bins: number[]): number[] {
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 128 }, (_, index) => {
          const cycle = (index % 16) / 16;
          return Number((0.3 + Math.sin(cycle * Math.PI) * 0.6).toFixed(3));
        });

  return normalizedBins.length < 128
    ? Array.from(
        { length: 128 },
        (_, index) => normalizedBins[Math.floor((index / 128) * normalizedBins.length)] || 0.3,
      )
    : normalizedBins;
}

export function resolveVisibleBeats(beatGrid: BeatGridPoint[], durationSeconds: number | null) {
  return durationSeconds && durationSeconds > 0
    ? deriveBeatGridGuideMarkers(beatGrid, durationSeconds)
    : [];
}

export function resolveAnchorPosition(input: {
  dragAnchorSecond: number | null;
  durationSeconds: number | null;
  visibleBeats: Array<{ second: number }>;
}): { anchorSecond: number | null; anchorPosition: number | null } {
  const anchorSecond = input.dragAnchorSecond ?? input.visibleBeats[0]?.second ?? null;
  const anchorPosition =
    anchorSecond !== null && input.durationSeconds && input.durationSeconds > 0
      ? Math.min(100, (anchorSecond / input.durationSeconds) * 100)
      : null;

  return { anchorSecond, anchorPosition };
}
