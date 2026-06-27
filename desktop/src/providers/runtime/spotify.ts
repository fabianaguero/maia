import type { PlaylistSourceInput, PlaylistMetadata, RemoteTrackMetadata, ProviderError } from "./types";
import { normalizePlaylistId, normalizeTrackId, normalizeIsoTimestamp } from "./normalization";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export function normalizeSpotifyPlaylist(raw: any): PlaylistMetadata {
  return {
    id: normalizePlaylistId("spotify", raw.id),
    sourceType: "spotify",
    sourceId: raw.id,
    sourceName: "Spotify",
    name: raw.name || "Untitled",
    description: raw.description || null,
    trackCount: raw.tracks?.total || 0,
    imageUrl: raw.images?.[0]?.url || null,
    isPublic: raw.public ?? false,
    externalUrl: raw.external_urls?.spotify || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export function normalizeSpotifyTrack(raw: any): RemoteTrackMetadata {
  const artists = Array.isArray(raw.artists) ? raw.artists : [];
  const artist = artists.length > 0 ? artists[0].name : "Unknown";

  return {
    id: normalizeTrackId("spotify", raw.id),
    sourceType: "spotify",
    title: raw.name || "Untitled",
    artist,
    durationSeconds: (raw.duration_ms || 0) / 1000,
    isPlayable: raw.is_playable ?? true,
    externalUrl: raw.external_urls?.spotify || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export async function listSpotifyPlaylists(
  input: PlaylistSourceInput,
): Promise<PlaylistMetadata[]> {
  if (!input.auth.oauthToken) {
    throw { kind: "auth_expired", sourceType: "spotify", message: "Token missing" } as ProviderError;
  }

  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `Bearer ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (response.status === 401) {
    throw { kind: "auth_expired", sourceType: "spotify", message: "Token invalid" } as ProviderError;
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
    throw { kind: "rate_limited", retryAfterSeconds: retryAfter } as ProviderError;
  }

  if (!response.ok) {
    throw {
      kind: "unknown",
      message: `Spotify API error: ${response.status}`,
    } as ProviderError;
  }

  const data = await response.json();
  return (data.items || []).map(normalizeSpotifyPlaylist);
}

export async function listTracksInSpotifyPlaylist(
  input: PlaylistSourceInput & { playlistId: string },
): Promise<RemoteTrackMetadata[]> {
  if (!input.auth.oauthToken) {
    throw { kind: "auth_expired", sourceType: "spotify", message: "Token missing" } as ProviderError;
  }

  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${input.playlistId}/tracks`, {
    headers: {
      Authorization: `Bearer ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw { kind: "not_found", resourceId: input.playlistId } as ProviderError;
    }
    throw {
      kind: "unknown",
      message: `Spotify API error: ${response.status}`,
    } as ProviderError;
  }

  const data = await response.json();
  return (data.items || [])
    .map((item: any) => item.track)
    .filter((track: any) => track !== null)
    .map(normalizeSpotifyTrack);
}
