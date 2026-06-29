import type { PlaylistSourceType, PlaylistMetadata, RemoteTrackMetadata } from "./types";

export function normalizePlaylistId(sourceType: PlaylistSourceType, platformId: string): string {
  return `${sourceType}:${platformId}`;
}

export function normalizeTrackId(sourceType: PlaylistSourceType, platformId: string): string {
  return `${sourceType}:${platformId}`;
}

export function extractPlatformId(normalizedId: string): string {
  const parts = normalizedId.split(":");
  return parts.slice(1).join(":");
}

export function normalizeIsoTimestamp(date?: string | number): string {
  if (!date) return new Date().toISOString();
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  return d.toISOString();
}

export function isoToDisplayDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
