import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeSoundCloudPlaylist,
  normalizeSoundCloudTrack,
  listSoundCloudPlaylists,
  listTracksInSoundCloudPlaylist,
} from "../../../src/providers/runtime/soundcloud";

describe("soundcloudRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeSoundCloudPlaylist", () => {
    it("converts SoundCloud API response to PlaylistMetadata", () => {
      const soundcloudPlaylist = {
        id: 123456,
        title: "Chill Vibes",
        description: "Relaxing electronic music",
        artwork_url: "https://example.com/image.jpg",
        track_count: 50,
        public: true,
        permalink_url: "https://soundcloud.com/user/chill-vibes",
        user: { username: "musiclover" },
      };

      const result = normalizeSoundCloudPlaylist(soundcloudPlaylist);

      expect(result.id).toBe("soundcloud:123456");
      expect(result.sourceType).toBe("soundcloud");
      expect(result.name).toBe("Chill Vibes");
      expect(result.trackCount).toBe(50);
      expect(result.imageUrl).toBe("https://example.com/image.jpg");
      expect(result.isPublic).toBe(true);
    });

    it("handles missing image URL", () => {
      const soundcloudPlaylist = {
        id: 789,
        title: "Test",
        description: null,
        artwork_url: null,
        track_count: 0,
        public: false,
        permalink_url: "https://soundcloud.com/test",
      };

      const result = normalizeSoundCloudPlaylist(soundcloudPlaylist);

      expect(result.imageUrl).toBeNull();
    });

    it("defaults untitled and null description", () => {
      const soundcloudPlaylist = {
        id: 999,
        title: "",
        description: null,
        artwork_url: null,
        track_count: 5,
        public: false,
        permalink_url: "https://soundcloud.com/test",
      };

      const result = normalizeSoundCloudPlaylist(soundcloudPlaylist);

      expect(result.name).toBe("Untitled");
      expect(result.description).toBeNull();
    });
  });

  describe("normalizeSoundCloudTrack", () => {
    it("converts SoundCloud track to RemoteTrackMetadata", () => {
      const soundcloudTrack = {
        id: 456789,
        title: "Electronic Dream",
        user: { username: "producer123" },
        duration: 240000,
        playable: true,
        permalink_url: "https://soundcloud.com/producer123/electronic-dream",
      };

      const result = normalizeSoundCloudTrack(soundcloudTrack);

      expect(result.id).toBe("soundcloud:456789");
      expect(result.sourceType).toBe("soundcloud");
      expect(result.title).toBe("Electronic Dream");
      expect(result.artist).toBe("producer123");
      expect(result.durationSeconds).toBe(240);
      expect(result.isPlayable).toBe(true);
    });

    it("defaults unknown artist when user missing", () => {
      const soundcloudTrack = {
        id: 456789,
        title: "Song",
        user: null,
        duration: 200000,
        permalink_url: "https://soundcloud.com/test",
        playable: true,
      };

      const result = normalizeSoundCloudTrack(soundcloudTrack);

      expect(result.artist).toBe("Unknown");
    });

    it("defaults unknown artist when username missing", () => {
      const soundcloudTrack = {
        id: 456789,
        title: "Song",
        user: {},
        duration: 200000,
        permalink_url: "https://soundcloud.com/test",
        playable: true,
      };

      const result = normalizeSoundCloudTrack(soundcloudTrack);

      expect(result.artist).toBe("Unknown");
    });
  });

  describe("listSoundCloudPlaylists", () => {
    it("calls SoundCloud API and normalizes results", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 111,
            title: "Playlist 1",
            description: "Desc 1",
            artwork_url: "https://example.com/art.jpg",
            track_count: 10,
            public: true,
            permalink_url: "https://soundcloud.com/user/playlist-1",
            user: { username: "testuser" },
          },
        ],
      });
      global.fetch = mockFetch;

      const result = await listSoundCloudPlaylists({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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
        "https://api.soundcloud.com/me/playlists",
        expect.objectContaining({
          headers: { Authorization: "OAuth mock-token" },
        }),
      );
    });

    it("throws auth_expired when token missing", async () => {
      const result = listSoundCloudPlaylists({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
          displayName: "Test",
          isConnected: true,
          lastSyncedAt: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });

      await expect(result).rejects.toMatchObject({
        kind: "auth_expired",
        sourceType: "soundcloud",
      });
    });

    it("throws auth_expired on 401 response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
      });

      const result = listSoundCloudPlaylists({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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
        sourceType: "soundcloud",
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

      const result = listSoundCloudPlaylists({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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

    it("throws unknown on non-auth API failures and tolerates non-array payloads", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map(),
      });

      await expect(
        listSoundCloudPlaylists({
          auth: {
            sourceType: "soundcloud",
            id: "soundcloud-user-123",
            displayName: "Test",
            isConnected: true,
            lastSyncedAt: null,
            oauthToken: "token",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        }),
      ).rejects.toMatchObject({
        kind: "unknown",
        message: "SoundCloud API error: 500",
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await expect(
        listSoundCloudPlaylists({
          auth: {
            sourceType: "soundcloud",
            id: "soundcloud-user-123",
            displayName: "Test",
            isConnected: true,
            lastSyncedAt: null,
            oauthToken: "token",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        }),
      ).resolves.toEqual([]);
    });
  });

  describe("listTracksInSoundCloudPlaylist", () => {
    it("calls SoundCloud tracks endpoint and normalizes results", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 222,
            title: "Track 1",
            user: { username: "artist1" },
            duration: 180000,
            permalink_url: "https://soundcloud.com/artist1/track-1",
            playable: true,
          },
        ],
      });

      const result = await listTracksInSoundCloudPlaylist({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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
      expect(result[0].title).toBe("Track 1");
    });

    it("throws not_found on 404 response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = listTracksInSoundCloudPlaylist({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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

    it("throws auth_expired when playlist-track requests have no token", async () => {
      await expect(
        listTracksInSoundCloudPlaylist({
          auth: {
            sourceType: "soundcloud",
            id: "soundcloud-user-123",
            displayName: "Test",
            isConnected: true,
            lastSyncedAt: null,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          playlistId: "playlist-1",
        }),
      ).rejects.toMatchObject({
        kind: "auth_expired",
        sourceType: "soundcloud",
      });
    });

    it("throws unknown on non-404 track errors and tolerates non-array payloads", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(
        listTracksInSoundCloudPlaylist({
          auth: {
            sourceType: "soundcloud",
            id: "soundcloud-user-123",
            displayName: "Test",
            isConnected: true,
            lastSyncedAt: null,
            oauthToken: "token",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          playlistId: "playlist-1",
        }),
      ).rejects.toMatchObject({
        kind: "unknown",
        message: "SoundCloud API error: 503",
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tracks: [] }),
      });

      await expect(
        listTracksInSoundCloudPlaylist({
          auth: {
            sourceType: "soundcloud",
            id: "soundcloud-user-123",
            displayName: "Test",
            isConnected: true,
            lastSyncedAt: null,
            oauthToken: "token",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          playlistId: "playlist-1",
        }),
      ).resolves.toEqual([]);
    });

    it("filters out null tracks", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            title: "Track 1",
            user: { username: "artist1" },
            duration: 100000,
            permalink_url: "https://...",
            playable: true,
          },
          null,
          {
            id: 2,
            title: "Track 2",
            user: { username: "artist2" },
            duration: 100000,
            permalink_url: "https://...",
            playable: true,
          },
        ],
      });

      const result = await listTracksInSoundCloudPlaylist({
        auth: {
          sourceType: "soundcloud",
          id: "soundcloud-user-123",
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
