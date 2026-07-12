import type {
  PlaylistSourceInput,
  PlaylistMetadata,
  RemoteTrackMetadata,
  ProviderError,
} from "./types";
import { normalizePlaylistId, normalizeTrackId, normalizeIsoTimestamp } from "./normalization";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeSpotifyPlaylist(raw: unknown): PlaylistMetadata {
  const playlist = asRecord(raw);
  const tracks = asRecord(playlist.tracks);
  const images = Array.isArray(playlist.images) ? playlist.images.map(asRecord) : [];
  const externalUrls = asRecord(playlist.external_urls);
  const sourceId = asString(playlist.id);

  return {
    id: normalizePlaylistId("spotify", sourceId),
    sourceType: "spotify",
    sourceId,
    sourceName: "Spotify",
    name: asString(playlist.name, "Untitled"),
    description: asString(playlist.description) || null,
    trackCount: asNumber(tracks.total),
    imageUrl: asString(images[0]?.url) || null,
    isPublic: asBoolean(playlist.public),
    externalUrl: asString(externalUrls.spotify) || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export function normalizeSpotifyTrack(raw: unknown): RemoteTrackMetadata {
  const track = asRecord(raw);
  const artists = Array.isArray(track.artists) ? track.artists.map(asRecord) : [];
  const artist = artists.length > 0 ? asString(artists[0].name, "Unknown") : "Unknown";
  const externalUrls = asRecord(track.external_urls);
  const sourceId = asString(track.id);

  return {
    id: normalizeTrackId("spotify", sourceId),
    sourceType: "spotify",
    title: asString(track.name, "Untitled"),
    artist,
    durationSeconds: asNumber(track.duration_ms) / 1000,
    isPlayable: asBoolean(track.is_playable, true),
    externalUrl: asString(externalUrls.spotify) || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export async function listSpotifyPlaylists(
  input: PlaylistSourceInput,
): Promise<PlaylistMetadata[]> {
  if (!input.auth.oauthToken) {
    throw {
      kind: "auth_expired",
      sourceType: "spotify",
      message: "Token missing",
    } as ProviderError;
  }

  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `Bearer ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (response.status === 401) {
    throw {
      kind: "auth_expired",
      sourceType: "spotify",
      message: "Token invalid",
    } as ProviderError;
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

  const data = asRecord(await response.json());
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(normalizeSpotifyPlaylist);
}

export async function listTracksInSpotifyPlaylist(
  input: PlaylistSourceInput & { playlistId: string },
): Promise<RemoteTrackMetadata[]> {
  if (!input.auth.oauthToken) {
    throw {
      kind: "auth_expired",
      sourceType: "spotify",
      message: "Token missing",
    } as ProviderError;
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

  const data = asRecord(await response.json());
  const items = Array.isArray(data.items) ? data.items.map(asRecord) : [];
  return items
    .map((item) => item.track)
    .filter((track): track is unknown => track !== null && track !== undefined)
    .map(normalizeSpotifyTrack);
}
