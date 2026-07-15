import type {
  PlaylistSourceInput,
  PlaylistMetadata,
  RemoteTrackMetadata,
  ProviderError,
} from "./types";
import { normalizePlaylistId, normalizeTrackId, normalizeIsoTimestamp } from "./normalization";

const SOUNDCLOUD_API_BASE = "https://api.soundcloud.com";

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

export function normalizeSoundCloudPlaylist(raw: unknown): PlaylistMetadata {
  const playlist = asRecord(raw);
  const sourceId = String(playlist.id ?? "");

  return {
    id: normalizePlaylistId("soundcloud", sourceId),
    sourceType: "soundcloud",
    sourceId,
    sourceName: "SoundCloud",
    name: asString(playlist.title, "Untitled"),
    description: asString(playlist.description) || null,
    trackCount: asNumber(playlist.track_count),
    imageUrl: asString(playlist.artwork_url) || null,
    isPublic: asBoolean(playlist.public),
    externalUrl: asString(playlist.permalink_url) || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export function normalizeSoundCloudTrack(raw: unknown): RemoteTrackMetadata {
  const track = asRecord(raw);
  const user = asRecord(track.user);
  const sourceId = String(track.id ?? "");
  const artist = asString(user.username, "Unknown");

  return {
    id: normalizeTrackId("soundcloud", sourceId),
    sourceType: "soundcloud",
    title: asString(track.title, "Untitled"),
    artist,
    durationSeconds: asNumber(track.duration) / 1000,
    isPlayable: asBoolean(track.playable, true),
    externalUrl: asString(track.permalink_url) || null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export async function listSoundCloudPlaylists(
  input: PlaylistSourceInput,
): Promise<PlaylistMetadata[]> {
  if (!input.auth.oauthToken) {
    throw {
      kind: "auth_expired",
      sourceType: "soundcloud",
      message: "Token missing",
    } as ProviderError;
  }

  const response = await fetch(`${SOUNDCLOUD_API_BASE}/me/playlists`, {
    headers: {
      Authorization: `OAuth ${input.auth.oauthToken}`,
    },
    signal: input.signal,
  });

  if (response.status === 401) {
    throw {
      kind: "auth_expired",
      sourceType: "soundcloud",
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
      message: `SoundCloud API error: ${response.status}`,
    } as ProviderError;
  }

  const data: unknown = await response.json();
  return (Array.isArray(data) ? data : []).map(normalizeSoundCloudPlaylist);
}

export async function listTracksInSoundCloudPlaylist(
  input: PlaylistSourceInput & { playlistId: string },
): Promise<RemoteTrackMetadata[]> {
  if (!input.auth.oauthToken) {
    throw {
      kind: "auth_expired",
      sourceType: "soundcloud",
      message: "Token missing",
    } as ProviderError;
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

  const data: unknown = await response.json();
  return (Array.isArray(data) ? data : [])
    .filter((track): track is unknown => track !== null && track !== undefined)
    .map(normalizeSoundCloudTrack);
}
