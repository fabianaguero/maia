import { describe, it, expect } from "vitest";
import {
  parseM3UPlaylist,
  parseJSONPlaylist,
  extractPlaylistNameFromPath,
} from "../../../src/providers/runtime/local";

describe("localRuntime", () => {
  describe("parseM3UPlaylist", () => {
    it("parses M3U playlist file and counts EXTINF lines", () => {
      const m3uContent = `#EXTM3U
#EXTINF:180,Artist Name - Song Title
/path/to/song1.mp3
#EXTINF:200,Another Artist - Another Song
/path/to/song2.mp3`;

      const result = parseM3UPlaylist(m3uContent, "/music/my-playlist.m3u");

      expect(result.name).toBe("my-playlist");
      expect(result.sourceType).toBe("local_directory");
      expect(result.trackCount).toBe(2);
      expect(result.sourceName).toBe("Local Directory");
    });

    it("handles empty M3U file", () => {
      const m3uContent = "#EXTM3U";

      const result = parseM3UPlaylist(m3uContent, "/music/empty.m3u");

      expect(result.trackCount).toBe(0);
      expect(result.name).toBe("empty");
    });

    it("generates consistent hash for same file path", () => {
      const m3uContent = "#EXTM3U";
      const filePath = "/music/test.m3u";

      const result1 = parseM3UPlaylist(m3uContent, filePath);
      const result2 = parseM3UPlaylist(m3uContent, filePath);

      expect(result1.id).toBe(result2.id);
      expect(result1.sourceId).toBe(result2.sourceId);
    });
  });

  describe("parseJSONPlaylist", () => {
    it("parses JSON playlist file with name and tracks", () => {
      const jsonContent = JSON.stringify({
        name: "My JSON Playlist",
        description: "Test playlist",
        tracks: [
          { title: "Song 1", artist: "Artist 1", duration: 180 },
          { title: "Song 2", artist: "Artist 2", duration: 200 },
        ],
      });

      const result = parseJSONPlaylist(jsonContent, "/music/my-playlist.json");

      expect(result.name).toBe("My JSON Playlist");
      expect(result.description).toBe("Test playlist");
      expect(result.trackCount).toBe(2);
      expect(result.sourceType).toBe("local_directory");
    });

    it("handles JSON without explicit name (uses filename)", () => {
      const jsonContent = JSON.stringify({
        description: "A playlist",
        tracks: [{ title: "Song 1" }],
      });

      const result = parseJSONPlaylist(jsonContent, "/music/fallback-name.json");

      expect(result.name).toBe("fallback-name");
    });

    it("handles JSON without tracks array", () => {
      const jsonContent = JSON.stringify({
        name: "No Tracks",
        description: "Empty playlist",
      });

      const result = parseJSONPlaylist(jsonContent, "/music/empty.json");

      expect(result.trackCount).toBe(0);
    });

    it("throws parsing_error on invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      expect(() => {
        parseJSONPlaylist(invalidJson, "/music/bad.json");
      }).toThrow();

      try {
        parseJSONPlaylist(invalidJson, "/music/bad.json");
      } catch (e) {
        expect(e).toMatchObject({
          kind: "parsing_error",
          sourceType: "local_directory",
        });
      }
    });
  });

  describe("extractPlaylistNameFromPath", () => {
    it("extracts filename without extension", () => {
      expect(extractPlaylistNameFromPath("/path/to/my-playlist.m3u")).toBe("my-playlist");
      expect(extractPlaylistNameFromPath("/path/my.playlist.json")).toBe("my.playlist");
      expect(extractPlaylistNameFromPath("simple.m3u")).toBe("simple");
    });

    it("handles paths without extension", () => {
      expect(extractPlaylistNameFromPath("/path/to/playlist")).toBe("playlist");
    });

    it("handles root file", () => {
      expect(extractPlaylistNameFromPath("/test.m3u")).toBe("test");
    });
  });
});
