export const DEFAULT_PLAYLIST_CROSSFADE_SECONDS = 6;

export function resolveNextPlaylistIndex(
  currentIndex: number,
  totalTracks: number,
): number | null {
  if (!Number.isFinite(currentIndex) || totalTracks <= 0) {
    return null;
  }

  if (totalTracks === 1) {
    return 0;
  }

  return (Math.max(0, currentIndex) + 1) % totalTracks;
}

export function resolvePlaylistCrossfadeSeconds(
  durationSeconds: number,
  preferredSeconds = DEFAULT_PLAYLIST_CROSSFADE_SECONDS,
): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  const maxSafeCrossfade = Math.max(0.8, durationSeconds * 0.25);
  return Number(Math.min(preferredSeconds, maxSafeCrossfade).toFixed(3));
}

export function resolvePlaylistTransitionDelayMs(
  durationSeconds: number,
  crossfadeSeconds: number,
): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 250;
  }

  const delaySeconds = Math.max(0.25, durationSeconds - Math.max(0, crossfadeSeconds));
  return Math.round(delaySeconds * 1000);
}
