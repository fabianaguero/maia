import { listSoundCloudPlaylists } from "../runtime/soundcloud";
import { listSpotifyPlaylists } from "../runtime/spotify";
import type {
  PlaylistMetadata,
  PlaylistSourceAuth,
  ProviderError,
  RemoteTrackMetadata,
} from "../runtime/types";

export function resolvePlaylistsForSource(
  playlists: PlaylistMetadata[],
  sourceId: string,
): PlaylistMetadata[] {
  return playlists.filter((playlist) => playlist.sourceId === sourceId);
}

export function mergeSourcePlaylists(
  playlists: PlaylistMetadata[],
  sourceId: string,
  nextPlaylists: PlaylistMetadata[],
): PlaylistMetadata[] {
  const filtered = playlists.filter((playlist) => playlist.sourceId !== sourceId);
  return [...filtered, ...nextPlaylists];
}

export function disconnectPlaylistSourceState(
  sources: PlaylistSourceAuth[],
  playlists: PlaylistMetadata[],
  sourceId: string,
): {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];
} {
  return {
    sources: sources.filter((source) => source.id !== sourceId),
    playlists: playlists.filter((playlist) => playlist.sourceId !== sourceId),
  };
}

export function filterPlaylistSources(
  sources: PlaylistSourceAuth[],
  sourceId: string,
): PlaylistSourceAuth[] {
  return sources.filter((source) => source.id !== sourceId);
}

export function filterSourcePlaylists(
  playlists: PlaylistMetadata[],
  sourceId: string,
): PlaylistMetadata[] {
  return playlists.filter((playlist) => playlist.sourceId !== sourceId);
}

export async function syncPlaylistSourcePlaylists(input: {
  source: PlaylistSourceAuth | undefined;
  signal?: AbortSignal;
}): Promise<PlaylistMetadata[]> {
  const { source, signal } = input;
  if (!source) {
    throw { kind: "not_found", resourceId: "unknown-source" } as ProviderError;
  }

  if (source.sourceType === "spotify" && source.oauthToken) {
    return listSpotifyPlaylists({
      auth: source,
      signal,
    });
  }

  if (source.sourceType === "soundcloud" && source.oauthToken) {
    return listSoundCloudPlaylists({
      auth: source,
      signal,
    });
  }

  return [];
}

export function normalizePlaylistSourceError(
  error: unknown,
  fallbackMessage: string,
): ProviderError {
  if (error && typeof error === "object" && "kind" in error) {
    return error as ProviderError;
  }

  return {
    kind: "unknown",
    message: fallbackMessage,
  };
}

export function createEmptyPlaylistTrackMap(): Map<string, RemoteTrackMetadata[]> {
  return new Map();
}
