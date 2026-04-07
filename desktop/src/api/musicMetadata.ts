/**
 * Music metadata service - integrates public data sources
 * Supports: MusicBrainz (open), Last.fm (freemium), Genius (API key required)
 */

export interface SongMetadata {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  duration?: number;
  genres?: string[];
  lyrics?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  source: "musicbrainz" | "lastfm" | "genius" | "local";
}

/**
 * Search MusicBrainz for song metadata
 * No API key required - open data
 */
export async function searchMusicBrainz(
  title: string,
  artist: string,
): Promise<SongMetadata | null> {
  try {
    const query = `${title} ${artist}`.trim();
    const url = new URL("https://musicbrainz.org/ws/2/recording");
    url.searchParams.set("query", query);
    url.searchParams.set("fmt", "json");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Maia/1.0 (contact: app@example.com)" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      recordings?: Array<{
        id: string;
        title: string;
        "artist-credit"?: Array<{ artist: { name: string } }>;
        releases?: Array<{
          date?: string;
          media?: Array<{
            "track-count"?: number;
          }>;
        }>;
      }>;
    };

    const recording = data.recordings?.[0];
    if (!recording) return null;

    const artistName =
      recording["artist-credit"]?.[0]?.artist.name || artist;
    const releaseDate = recording.releases?.[0]?.date;
    const releaseYear = releaseDate ? parseInt(releaseDate.split("-")[0], 10) : undefined;

    return {
      title: recording.title,
      artist: artistName,
      releaseYear,
      source: "musicbrainz",
    };
  } catch {
    return null;
  }
}

/**
 * Search Last.fm for song metadata
 * Free tier available - requires API key
 */
export async function searchLastFm(
  title: string,
  artist: string,
  apiKey?: string,
): Promise<SongMetadata | null> {
  if (!apiKey) {
    console.warn("Last.fm API key not provided - skipping");
    return null;
  }

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "track.getInfo");
    url.searchParams.set("artist", artist);
    url.searchParams.set("track", title);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as {
      track?: {
        name: string;
        artist: { name: string };
        album?: { title: string };
        duration?: string;
        url?: string;
        wiki?: { published: string };
      };
    };

    const track = data.track;
    if (!track) return null;

    return {
      title: track.name,
      artist: track.artist.name,
      album: track.album?.title,
      duration: track.duration ? parseInt(track.duration, 10) / 1000 : undefined,
      source: "lastfm",
      spotifyUrl: track.url,
    };
  } catch {
    return null;
  }
}

/**
 * Search Genius for lyrics
 * Requires API token - register at https://genius.com/api-clients
 */
export async function searchGenius(
  title: string,
  artist: string,
  accessToken?: string,
): Promise<{ lyrics: string; url: string } | null> {
  if (!accessToken) {
    console.warn("Genius API token not provided - skipping lyrics");
    return null;
  }

  try {
    const url = new URL("https://api.genius.com/search");
    url.searchParams.set("q", `${title} ${artist}`.trim());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      response: {
        hits: Array<{
          result: {
            url: string;
            title: string;
          };
        }>;
      };
    };

    const hit = data.response?.hits?.[0];
    if (!hit) return null;

    return {
      url: hit.result.url,
      lyrics: "", // Would need to scrape the page or use additional API
    };
  } catch {
    return null;
  }
}

/**
 * Fetch comprehensive metadata combining multiple sources
 */
export async function fetchSongMetadata(
  title: string,
  artist: string,
  options?: {
    lastFmApiKey?: string;
    geniusToken?: string;
    sources?: Array<"musicbrainz" | "lastfm" | "genius">;
  },
): Promise<SongMetadata | null> {
  const sources = options?.sources || ["musicbrainz", "lastfm"];
  let metadata: SongMetadata | null = null;

  // Try MusicBrainz first (open data)
  if (sources.includes("musicbrainz")) {
    metadata = await searchMusicBrainz(title, artist);
  }

  // Enhance with Last.fm if available
  if (sources.includes("lastfm") && options?.lastFmApiKey) {
    const lastFmData = await searchLastFm(
      title,
      artist,
      options.lastFmApiKey,
    );
    if (lastFmData && metadata) {
      metadata = { ...metadata, ...lastFmData, source: "musicbrainz" };
    } else if (lastFmData) {
      metadata = lastFmData;
    }
  }

  // Try Genius for lyrics if token provided
  if (sources.includes("genius") && options?.geniusToken && metadata) {
    const geniusData = await searchGenius(
      title,
      artist,
      options.geniusToken,
    );
    if (geniusData) {
      metadata = { ...metadata, lyrics: geniusData.lyrics };
    }
  }

  return metadata;
}
