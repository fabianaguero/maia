/**
 * Normalize a playlist ID by prefixing it with the source type
 */
export function normalizePlaylistId(sourceType: string, id: string): string {
  return `${sourceType}:${id}`;
}

/**
 * Normalize a track ID by prefixing it with the source type
 */
export function normalizeTrackId(sourceType: string, id: string): string {
  return `${sourceType}:${id}`;
}

/**
 * Get the current ISO timestamp
 */
export function normalizeIsoTimestamp(): string {
  return new Date().toISOString();
}
