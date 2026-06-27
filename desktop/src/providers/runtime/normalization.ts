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

/**
 * Convert ISO timestamp to display date
 */
export function isoToDisplayDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
