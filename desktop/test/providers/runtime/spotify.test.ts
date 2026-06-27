import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeSpotifyPlaylist,
  normalizeSpotifyTrack,
  listSpotifyPlaylists,
  listTracksInSpotifyPlaylist,
} from "../../../src/providers/runtime/spotify";

describe("spotifyRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeSpotifyPlaylist", () => {
    it("converts Spotify API response to PlaylistMetadata", () => {
      const spotifyPlaylist = {
        id: "37i9dQZF1DX4JfIHF4CB8O",
        name: "Today's Top Hits",
        description: "The hottest hits right now",
        images: [{ url: "https://example.com/image.jpg" }],
        tracks: { total: 50 },
        public: true,
        external_urls: { spotify: "https://open.spotify.com/playlist/37i9dQZF1DX4JfIHF4CB8O" },
        uri: "spotify:playlist:37i9dQZF1DX4JfIHF4CB8O",
      };

      const result = normalizeSpotifyPlaylist(spotifyPlaylist);

      expect(result.id).toBe("spotify:37i9dQZF1DX4JfIHF4CB8O");
      expect(result.sourceType).toBe("spotify");
      expect(result.name).toBe("Today's Top Hits");
      expect(result.trackCount).toBe(50);
      expect(result.imageUrl).toBe("https://example.com/image.jpg");
      expect(result.isPublic).toBe(true);
    });

    it("handles missing image URL", () => {
      const spotifyPlaylist = {
        id: "test-id",
        name: "Test",
        description: null,
        images: [],
        tracks: { total: 0 },
        public: false,
        external_urls: { spotify: "https://..." },
      };

      const result = normalizeSpotifyPlaylist(spotifyPlaylist);

      expect(result.imageUrl).toBeNull();
    });

    it("defaults untitled and null description", () => {
      const spotifyPlaylist = {
        id: "id",
        name: "",
        description: null,
        images: [],
        tracks: { total: 5 },
        public: false,
        external_urls: { spotify: "https://..." },
      };

      const result = normalizeSpotifyPlaylist(spotifyPlaylist);

      expect(result.name).toBe("Untitled");
      expect(result.description).toBeNull();
    });
  });

  describe("normalizeSpotifyTrack", () => {
    it("converts Spotify track to RemoteTrackMetadata", () => {
      const spotifyTrack = {
        id: "track-123",
        name: "Song Title",
        artists: [{ name: "Artist Name" }],
        duration_ms: 180000,
        explicit: false,
        external_urls: { spotify: "https://open.spotify.com/track/track-123" },
        is_playable: true,
      };

      const result = normalizeSpotifyTrack(spotifyTrack);

      expect(result.id).toBe("spotify:track-123");
      expect(result.sourceType).toBe("spotify");
      expect(result.title).toBe("Song Title");
      expect(result.artist).toBe("Artist Name");
      expect(result.durationSeconds).toBe(180);
      expect(result.isPlayable).toBe(true);
    });

    it("handles multiple artists (uses first)", () => {
      const spotifyTrack = {
        id: "track-123",
        name: "Song",
        artists: [{ name: "Artist 1" }, { name: "Artist 2" }],
        duration_ms: 200000,
        external_urls: { spotify: "https://..." },
        is_playable: true,
      };

      const result = normalizeSpotifyTrack(spotifyTrack);

      expect(result.artist).toBe("Artist 1");
    });

    it("defaults unknown artist when empty", () => {
      const spotifyTrack = {
        id: "track-123",
        name: "Song",
        artists: [],
        duration_ms: 0,
        external_urls: { spotify: "https://..." },
        is_playable: true,
      };

      const result = normalizeSpotifyTrack(spotifyTrack);

      expect(result.artist).toBe("Unknown");
    });
  });

  describe("listSpotifyPlaylists", () => {
    it("calls Spotify API and normalizes results", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "p1",
              name: "Playlist 1",
              description: "Desc 1",
              images: [{ url: "https://..." }],
              tracks: { total: 10 },
              public: true,
              external_urls: { spotify: "https://..." },
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const result = await listSpotifyPlaylists({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test User",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "mock-token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Playlist 1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.spotify.com/v1/me/playlists",
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        }),
      );
    });

    it("throws auth_expired when token missing", async () => {
      const result = listSpotifyPlaylists({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });

      await expect(result).rejects.toMatchObject({
        kind: "auth_expired",
        sourceType: "spotify",
      });
    });

    it("throws auth_expired on 401 response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
      });

      const result = listSpotifyPlaylists({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "expired-token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });

      await expect(result).rejects.toMatchObject({
        kind: "auth_expired",
        sourceType: "spotify",
      });
    });

    it("throws rate_limited on 429 response", async () => {
      const mockHeaders = new Map();
      mockHeaders.set("Retry-After", "120");
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: mockHeaders,
      });

      const result = listSpotifyPlaylists({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });

      await expect(result).rejects.toMatchObject({
        kind: "rate_limited",
        retryAfterSeconds: 120,
      });
    });
  });

  describe("listTracksInSpotifyPlaylist", () => {
    it("calls Spotify tracks endpoint and normalizes results", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              track: {
                id: "track-1",
                name: "Song 1",
                artists: [{ name: "Artist 1" }],
                duration_ms: 200000,
                external_urls: { spotify: "https://..." },
                is_playable: true,
              },
            },
          ],
        }),
      });

      const result = await listTracksInSpotifyPlaylist({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        playlistId: "playlist-1",
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Song 1");
    });

    it("throws not_found on 404 response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = listTracksInSpotifyPlaylist({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        playlistId: "missing-playlist",
      });

      await expect(result).rejects.toMatchObject({
        kind: "not_found",
        resourceId: "missing-playlist",
      });
    });

    it("filters out null tracks", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { track: { id: "1", name: "Song 1", artists: [], duration_ms: 100000, external_urls: {}, is_playable: true } },
            { track: null },
            { track: { id: "2", name: "Song 2", artists: [], duration_ms: 100000, external_urls: {}, is_playable: true } },
          ],
        }),
      });

      const result = await listTracksInSpotifyPlaylist({
        auth: {
          sourceType: "spotify",
          id: "spotify-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          oauthToken: "token",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        playlistId: "playlist-1",
      });

      expect(result).toHaveLength(2);
    });
  });
});
