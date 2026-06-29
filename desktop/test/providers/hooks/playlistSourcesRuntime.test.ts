import { describe, expect, it, vi } from "vitest";

import type { PlaylistMetadata, PlaylistSourceAuth, ProviderError } from "../../../src/providers/runtime/types";

const { listSpotifyPlaylistsMock, listSoundCloudPlaylistsMock } = vi.hoisted(() => ({
  listSpotifyPlaylistsMock: vi.fn(),
  listSoundCloudPlaylistsMock: vi.fn(),
}));

vi.mock("../../../src/providers/runtime/spotify", () => ({
  listSpotifyPlaylists: listSpotifyPlaylistsMock,
}));

vi.mock("../../../src/providers/runtime/soundcloud", () => ({
  listSoundCloudPlaylists: listSoundCloudPlaylistsMock,
}));

import {
  createEmptyPlaylistTrackMap,
  disconnectPlaylistSourceState,
  filterPlaylistSources,
  filterSourcePlaylists,
  mergeSourcePlaylists,
  normalizePlaylistSourceError,
  resolvePlaylistsForSource,
  syncPlaylistSourcePlaylists,
} from "../../../src/providers/hooks/playlistSourcesRuntime";

function createSource(overrides: Partial<PlaylistSourceAuth> = {}): PlaylistSourceAuth {
  return {
    sourceType: "spotify",
    id: "spotify-source",
    displayName: "Spotify",
    isConnected: true,
    lastSyncedAt: null,
    oauthToken: "token-123",
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
    ...overrides,
  };
}

function createPlaylist(overrides: Partial<PlaylistMetadata> = {}): PlaylistMetadata {
  return {
    id: "playlist-1",
    sourceType: "spotify",
    sourceId: "spotify-source",
    sourceName: "Spotify",
    name: "Night Drive",
    description: null,
    trackCount: 12,
    imageUrl: null,
    isPublic: false,
    externalUrl: null,
    syncedAt: "2026-06-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("playlistSourcesRuntime", () => {
  it("creates a fresh empty track map", () => {
    const first = createEmptyPlaylistTrackMap();
    const second = createEmptyPlaylistTrackMap();

    expect(first).toBeInstanceOf(Map);
    expect(second).toBeInstanceOf(Map);
    expect(first).not.toBe(second);
  });

  it("filters and merges playlists by source", () => {
    const spotifyPlaylist = createPlaylist();
    const soundcloudPlaylist = createPlaylist({
      id: "playlist-2",
      sourceType: "soundcloud",
      sourceId: "soundcloud-source",
      sourceName: "SoundCloud",
    });

    expect(resolvePlaylistsForSource([spotifyPlaylist, soundcloudPlaylist], "spotify-source")).toEqual([
      spotifyPlaylist,
    ]);

    expect(
      mergeSourcePlaylists([spotifyPlaylist, soundcloudPlaylist], "spotify-source", [
        createPlaylist({ id: "playlist-3", name: "Fresh Sync" }),
      ]),
    ).toEqual([
      soundcloudPlaylist,
      createPlaylist({ id: "playlist-3", name: "Fresh Sync" }),
    ]);
  });

  it("filters disconnected source state", () => {
    const spotifySource = createSource();
    const soundcloudSource = createSource({
      id: "soundcloud-source",
      sourceType: "soundcloud",
      displayName: "SoundCloud",
    });
    const spotifyPlaylist = createPlaylist();
    const soundcloudPlaylist = createPlaylist({
      id: "playlist-2",
      sourceType: "soundcloud",
      sourceId: "soundcloud-source",
      sourceName: "SoundCloud",
    });

    expect(filterPlaylistSources([spotifySource, soundcloudSource], "spotify-source")).toEqual([
      soundcloudSource,
    ]);
    expect(filterSourcePlaylists([spotifyPlaylist, soundcloudPlaylist], "spotify-source")).toEqual([
      soundcloudPlaylist,
    ]);
    expect(
      disconnectPlaylistSourceState(
        [spotifySource, soundcloudSource],
        [spotifyPlaylist, soundcloudPlaylist],
        "spotify-source",
      ),
    ).toEqual({
      sources: [soundcloudSource],
      playlists: [soundcloudPlaylist],
    });
  });

  it("routes syncs to Spotify and SoundCloud runtimes", async () => {
    const spotifyPlaylists = [createPlaylist()];
    const soundcloudPlaylists = [
      createPlaylist({
        id: "sc-1",
        sourceType: "soundcloud",
        sourceId: "soundcloud-source",
        sourceName: "SoundCloud",
      }),
    ];
    listSpotifyPlaylistsMock.mockResolvedValue(spotifyPlaylists);
    listSoundCloudPlaylistsMock.mockResolvedValue(soundcloudPlaylists);

    await expect(
      syncPlaylistSourcePlaylists({
        source: createSource(),
      }),
    ).resolves.toEqual(spotifyPlaylists);

    await expect(
      syncPlaylistSourcePlaylists({
        source: createSource({
          id: "soundcloud-source",
          sourceType: "soundcloud",
          displayName: "SoundCloud",
        }),
      }),
    ).resolves.toEqual(soundcloudPlaylists);
  });

  it("returns an empty playlist set for unsupported sources without tokens", async () => {
    await expect(
      syncPlaylistSourcePlaylists({
        source: createSource({
          sourceType: "local_directory",
          oauthToken: undefined,
          localPath: "/music",
        }),
      }),
    ).resolves.toEqual([]);
  });

  it("normalizes missing-source and unknown errors", async () => {
    await expect(syncPlaylistSourcePlaylists({ source: undefined })).rejects.toEqual({
      kind: "not_found",
      resourceId: "unknown-source",
    });

    const providerError: ProviderError = {
      kind: "network_error",
      message: "offline",
    };

    expect(normalizePlaylistSourceError(providerError, "fallback")).toBe(providerError);
    expect(normalizePlaylistSourceError(new Error("boom"), "fallback")).toEqual({
      kind: "unknown",
      message: "fallback",
    });
  });
});
