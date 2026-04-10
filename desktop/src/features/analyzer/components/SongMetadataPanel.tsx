import { Loader2, Music, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSongMetadata, type SongMetadata } from "../../../api/musicMetadata";
import type { LibraryTrack } from "../../../types/library";
import { getTrackSourcePath } from "../../../utils/track";

interface SongMetadataPanelProps {
  track: LibraryTrack;
}

export function SongMetadataPanel({ track }: SongMetadataPanelProps) {
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchMetadata() {
      setLoading(true);
      setError(null);

      try {
        // Prefer persisted track tags before falling back to filename parsing.
        const taggedTitle = track.tags.title.trim();
        const taggedArtist = track.tags.artist?.trim();
        const filename = taggedTitle || getTrackSourcePath(track).split("/").pop() || "";
        const titleMatch = filename.match(/^([^-]+)(?:\s*-\s*(.+))?/);
        const title = taggedTitle || titleMatch?.[1]?.trim() || filename;
        const artist = taggedArtist || titleMatch?.[2]?.trim() || "Unknown Artist";

        const data = await fetchSongMetadata(title, artist, {
          sources: ["musicbrainz"],
        });

        if (active) {
          setMetadata(data);
          if (!data) {
            setError("No metadata found for this track");
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch metadata");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchMetadata();

    return () => {
      active = false;
    };
  }, [track.tags.title, track.tags.artist, track.file.sourcePath]);

  return (
    <div className="panel analyzer-panel song-metadata-panel">
      <div className="panel-header">
        <h3>
          <Music size={16} />
          Song Info
        </h3>
      </div>

      <div className="panel-body">
        {loading && (
          <div className="metadata-loading">
            <Loader2 size={16} className="spin-ring" />
            <span>Fetching metadata...</span>
          </div>
        )}

        {error && !loading && (
          <div className="metadata-error">
            <p>{error}</p>
          </div>
        )}

        {metadata && !loading && (
          <div className="metadata-content">
            <div className="metadata-item">
              <label>Title</label>
              <p>{metadata.title}</p>
            </div>

            {metadata.artist && (
              <div className="metadata-item">
                <label>Artist</label>
                <p>{metadata.artist}</p>
              </div>
            )}

            {metadata.album && (
              <div className="metadata-item">
                <label>Album</label>
                <p>{metadata.album}</p>
              </div>
            )}

            {metadata.releaseYear && (
              <div className="metadata-item">
                <label>Released</label>
                <p>{metadata.releaseYear}</p>
              </div>
            )}

            {metadata.genres && metadata.genres.length > 0 && (
              <div className="metadata-item">
                <label>Genres</label>
                <div className="metadata-tags">
                  {metadata.genres.map((genre) => (
                    <span key={genre} className="metadata-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.spotifyUrl && (
              <div className="metadata-item">
                <a
                  href={metadata.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="metadata-link"
                >
                  View on Spotify
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="metadata-source">
              <small>Source: {metadata.source}</small>
            </div>
          </div>
        )}

        {!metadata && !loading && !error && (
          <div className="metadata-empty">
            <p>No metadata available</p>
          </div>
        )}
      </div>
    </div>
  );
}
