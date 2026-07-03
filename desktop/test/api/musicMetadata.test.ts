import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchSongMetadata,
  searchGenius,
  searchLastFm,
  searchMusicBrainz,
} from "../../src/api/musicMetadata";

describe("musicMetadata", () => {
  const fetchMock = vi.fn();
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches MusicBrainz metadata and derives the release year", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        recordings: [
          {
            title: "Around the World",
            "artist-credit": [{ artist: { name: "Daft Punk" } }],
            releases: [{ date: "1997-03-17" }],
          },
        ],
      }),
    });

    await expect(searchMusicBrainz("Around the World", "Daft Punk")).resolves.toEqual({
      title: "Around the World",
      artist: "Daft Punk",
      releaseYear: 1997,
      source: "musicbrainz",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("musicbrainz.org/ws/2/recording"),
      expect.objectContaining({
        headers: { "User-Agent": "Maia/1.0 (contact: app@example.com)" },
      }),
    );
  });

  it("returns null for empty or failed MusicBrainz responses", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(searchMusicBrainz("Song", "Artist")).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recordings: [] }),
    });
    await expect(searchMusicBrainz("Song", "Artist")).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(searchMusicBrainz("Song", "Artist")).resolves.toBeNull();
  });

  it("falls back to the requested artist and leaves release year undefined when MusicBrainz lacks both", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recordings: [
          {
            title: "Windowlicker",
          },
        ],
      }),
    });

    await expect(searchMusicBrainz("Windowlicker", "Aphex Twin")).resolves.toEqual({
      title: "Windowlicker",
      artist: "Aphex Twin",
      releaseYear: undefined,
      source: "musicbrainz",
    });
  });

  it("skips Last.fm without an API key and warns once", async () => {
    await expect(searchLastFm("One More Time", "Daft Punk")).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Last.fm API key not provided - skipping");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches Last.fm metadata and converts duration to seconds", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        track: {
          name: "One More Time",
          artist: { name: "Daft Punk" },
          album: { title: "Discovery" },
          duration: "320000",
          url: "https://last.fm/track/one-more-time",
        },
      }),
    });

    await expect(searchLastFm("One More Time", "Daft Punk", "key-123")).resolves.toEqual({
      title: "One More Time",
      artist: "Daft Punk",
      album: "Discovery",
      duration: 320,
      source: "lastfm",
      spotifyUrl: "https://last.fm/track/one-more-time",
    });
  });

  it("keeps Last.fm duration undefined when the API omits it", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        track: {
          name: "Windowlicker",
          artist: { name: "Aphex Twin" },
          album: { title: "Windowlicker" },
          url: "https://last.fm/track/windowlicker",
        },
      }),
    });

    await expect(searchLastFm("Windowlicker", "Aphex Twin", "key-123")).resolves.toEqual({
      title: "Windowlicker",
      artist: "Aphex Twin",
      album: "Windowlicker",
      duration: undefined,
      source: "lastfm",
      spotifyUrl: "https://last.fm/track/windowlicker",
    });
  });

  it("returns null for failed, empty or rejected Last.fm responses", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(searchLastFm("One More Time", "Daft Punk", "key-123")).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await expect(searchLastFm("One More Time", "Daft Punk", "key-123")).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("lastfm offline"));
    await expect(searchLastFm("One More Time", "Daft Punk", "key-123")).resolves.toBeNull();
  });

  it("skips Genius without a token and warns once", async () => {
    await expect(searchGenius("Music", "Madonna")).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Genius API token not provided - skipping lyrics");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the top Genius hit when a token is available", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          hits: [
            {
              result: {
                url: "https://genius.com/Madonna-music-lyrics",
                title: "Music",
              },
            },
          ],
        },
      }),
    });

    await expect(searchGenius("Music", "Madonna", "genius-token")).resolves.toEqual({
      url: "https://genius.com/Madonna-music-lyrics",
      lyrics: "",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("api.genius.com/search"),
      expect.objectContaining({
        headers: { Authorization: "Bearer genius-token" },
      }),
    );
  });

  it("returns null for failed, empty or rejected Genius responses", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(searchGenius("Music", "Madonna", "genius-token")).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: {
          hits: [],
        },
      }),
    });
    await expect(searchGenius("Music", "Madonna", "genius-token")).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("genius offline"));
    await expect(searchGenius("Music", "Madonna", "genius-token")).resolves.toBeNull();
  });

  it("merges MusicBrainz, Last.fm and Genius data into a single metadata payload", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recordings: [
            {
              title: "Music",
              "artist-credit": [{ artist: { name: "Madonna" } }],
              releases: [{ date: "2000-08-21" }],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          track: {
            name: "Music",
            artist: { name: "Madonna" },
            album: { title: "Music" },
            duration: "225000",
            url: "https://last.fm/track/music",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            hits: [{ result: { url: "https://genius.com/Madonna-music-lyrics", title: "Music" } }],
          },
        }),
      });

    await expect(
      fetchSongMetadata("Music", "Madonna", {
        lastFmApiKey: "lastfm-key",
        geniusToken: "genius-token",
        sources: ["musicbrainz", "lastfm", "genius"],
      }),
    ).resolves.toEqual({
      title: "Music",
      artist: "Madonna",
      album: "Music",
      duration: 225,
      releaseYear: 2000,
      source: "musicbrainz",
      spotifyUrl: "https://last.fm/track/music",
      lyrics: "",
    });
  });

  it("falls back to Last.fm when MusicBrainz is disabled or unavailable", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        track: {
          name: "Sweet Dreams",
          artist: { name: "Eurythmics" },
          duration: "240000",
        },
      }),
    });

    await expect(
      fetchSongMetadata("Sweet Dreams", "Eurythmics", {
        lastFmApiKey: "lastfm-key",
        sources: ["lastfm"],
      }),
    ).resolves.toEqual({
      title: "Sweet Dreams",
      artist: "Eurythmics",
      duration: 240,
      source: "lastfm",
      album: undefined,
      spotifyUrl: undefined,
    });
  });

  it("returns null when no source yields metadata and Genius has no base payload to enrich", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recordings: [],
      }),
    });

    await expect(
      fetchSongMetadata("Unknown", "Nobody", {
        geniusToken: "genius-token",
        sources: ["musicbrainz", "genius"],
      }),
    ).resolves.toBeNull();
  });

  it("uses the default source order when no options are provided", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recordings: [
          {
            title: "Technologic",
            "artist-credit": [{ artist: { name: "Daft Punk" } }],
            releases: [{ date: "2005-01-24" }],
          },
        ],
      }),
    });

    await expect(fetchSongMetadata("Technologic", "Daft Punk")).resolves.toEqual({
      title: "Technologic",
      artist: "Daft Punk",
      releaseYear: 2005,
      source: "musicbrainz",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
