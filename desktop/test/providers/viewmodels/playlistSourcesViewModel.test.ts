import { describe, it, expect } from "vitest";
import {
  buildPlaylistSourcesViewModel,
  type SourceCardViewModel,
} from "../../../src/providers/viewmodels/playlistSourcesViewModel";

describe("playlistSourcesViewModel", () => {
  it("builds SourceCard for each connected source", () => {
    const sources = [
      {
        sourceType: "spotify" as const,
        id: "spotify-user-123",
        displayName: "Spotify (user@example.com)",
        isConnected: true,
        lastSyncedAt: "2026-06-27T10:00:00Z",
        oauthToken: "token",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-06-27T10:00:00Z",
      },
    ];

    const playlists = [
      {
        id: "spotify:p1",
        sourceType: "spotify" as const,
        sourceId: "spotify-user-123",
        sourceName: "Spotify",
        name: "My Playlist",
        description: null,
        trackCount: 10,
        imageUrl: null,
        isPublic: true,
        externalUrl: null,
        syncedAt: "2026-06-27T10:00:00Z",
      },
    ];

    const result = buildPlaylistSourcesViewModel({
      sources,
      playlists,
      loading: false,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].displayName).toBe("Spotify (user@example.com)");
    expect(result.cards[0].playlistCount).toBe(1);
    expect(result.totalPlaylists).toBe(1);
  });

  it("returns empty when no sources", () => {
    const result = buildPlaylistSourcesViewModel({
      sources: [],
      playlists: [],
      loading: false,
    });

    expect(result.isEmpty).toBe(true);
    expect(result.cards).toHaveLength(0);
  });
});
