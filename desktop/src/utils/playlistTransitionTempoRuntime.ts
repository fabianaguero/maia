import type { LibraryTrack } from "../types/library";

import { clampPlaylistMetric, roundPlaylistMetric } from "./playlistTransitionSharedRuntime";

export function resolvePlaylistTempoRatio(
  currentTrack: LibraryTrack | null,
  nextTrack: LibraryTrack,
): number {
  const currentBpm = currentTrack?.analysis.bpm ?? null;
  const nextBpm = nextTrack.analysis.bpm;
  if (
    typeof currentBpm !== "number" ||
    !Number.isFinite(currentBpm) ||
    currentBpm <= 0 ||
    typeof nextBpm !== "number" ||
    !Number.isFinite(nextBpm) ||
    nextBpm <= 0 ||
    nextTrack.performance.bpmLock
  ) {
    return 1;
  }

  const rawRatio = currentBpm / nextBpm;
  if (Math.abs(rawRatio - 1) > 0.06) {
    return 1;
  }

  const normalized = clampPlaylistMetric(rawRatio, 0.94, 1.06);
  return Math.abs(normalized - 1) < 0.005 ? 1 : roundPlaylistMetric(normalized);
}
