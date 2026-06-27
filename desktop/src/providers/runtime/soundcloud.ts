import type { PlaylistSourceInput, PlaylistMetadata, RemoteTrackMetadata, ProviderError } from "./types";
import { normalizePlaylistId, normalizeTrackId, normalizeIsoTimestamp } from "./normalization";

const SOUNDCLOUD_API_BASE = "https://api.soundcloud.com";

export function normalizeSoundCloudPlaylist(raw: any): PlaylistMetadata {
  return {
    id: normalizePlaylistId("soundcloud", `${raw.id}`),
    sourceType: "soundcloud",
    sourceId: `${raw.id}`,
    sourceName: "SoundCloud",
    name: raw.title || "Untitled",
    description: raw.description || null,
    trackCount: raw.track_count || 0,
    imageUrl: raw.artwork_url || null,
    isPublic: raw.public ?? false,
    externalUrl: raw.permalink_url || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export function normalizeSoundCloudTrack(raw: any): RemoteTrackMetadata {
  const artist = raw.user?.username || "Unknown";

  return {
    id: normalizeTrackId("soundcloud", `${raw.id}`),
    sourceType: "soundcloud",
    title: raw.title || "Untitled",
    artist,
    durationSeconds: (raw.duration || 0) / 1000,
    isPlayable: raw.playable ?? true,
    externalUrl: raw.permalink_url || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export async function listSoundCloudPlaylists(
  input: PlaylistSourceInput,
): Promise<PlaylistMetadata[]> {
  if (!input.auth.oauthToken) {
    throw { kind: "auth_expired", sourceType: "soundcloud", message: "Token missing" } as ProviderError;
  }

  const response = await fetch(`${SOUNDCLOUD_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `OAuth ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (response.status === 401) {
    throw { kind: "auth_expired", sourceType: "soundcloud", message: "Token invalid" } as ProviderError;
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
    throw { kind: "rate_limited", retryAfterSeconds: retryAfter } as ProviderError;
  }

  if (!response.ok) {
    throw {
      kind: "unknown",
      message: `SoundCloud API error: ${response.status}`,
    } as ProviderError;
  }

  const data = await response.json();
  return (Array.isArray(data) ? data : []).map(normalizeSoundCloudPlaylist);
}

export async function listTracksInSoundCloudPlaylist(
  input: PlaylistSourceInput & { playlistId: string },
): Promise<RemoteTrackMetadata[]> {
  if (!input.auth.oauthToken) {
    throw { kind: "auth_expired", sourceType: "soundcloud", message: "Token missing" } as ProviderError;
  }

  const response = await fetch(`${SOUNDCLOUD_API_BASE}/playlists/${input.playlistId}/tracks`, {
    headers: {
      Authorization: `OAuth ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw { kind: "not_found", resourceId: input.playlistId } as ProviderError;
    }
    throw {
      kind: "unknown",
      message: `SoundCloud API error: ${response.status}`,
    } as ProviderError;
  }

  const data = await response.json();
  return (Array.isArray(data) ? data : [])
    .filter((track: any) => track !== null)
    .map(normalizeSoundCloudTrack);
}
