import { Loader2, Music, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSongMetadata, type SongMetadata } from "../../../api/musicMetadata";
import { useT } from "../../../i18n/I18nContext";
import type { LibraryTrack } from "../../../types/library";
import { getTrackSourcePath } from "../../../utils/track";

interface SongMetadataPanelProps {
  track: LibraryTrack;
}

export function SongMetadataPanel({ track }: SongMetadataPanelProps) {
  const t = useT();
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taggedTitle = track.tags.title;
  const taggedArtist = track.tags.artist ?? "";
  const trackSourcePath = getTrackSourcePath(track);

  useEffect(() => {
    let active = true;

    async function fetchMetadata() {
      setLoading(true);
      setError(null);

      try {
        // Prefer persisted track tags before falling back to filename parsing.
        const trimmedTitle = taggedTitle.trim();
        const trimmedArtist = taggedArtist.trim();
        const filename = trimmedTitle || trackSourcePath.split("/").pop() || "";
        const titleMatch = filename.match(/^([^-]+)(?:\s*-\s*(.+))?/);
        const title = trimmedTitle || titleMatch?.[1]?.trim() || filename;
        const artist = trimmedArtist || titleMatch?.[2]?.trim() || "Unknown Artist";

        const data = await fetchSongMetadata(title, artist, {
          sources: ["musicbrainz"],
        });

        if (active) {
          setMetadata(data);
          if (!data) {
            setError(t.inspect.noMetadataFound);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : t.inspect.failedMetadataFetch);
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
  }, [
    taggedArtist,
    taggedTitle,
    t.inspect.failedMetadataFetch,
    t.inspect.noMetadataFound,
    trackSourcePath,
  ]);

  return (
    <div className="panel analyzer-panel song-metadata-panel">
      <div className="panel-header">
        <h3>
          <Music size={16} />
          {t.inspect.songInfo}
        </h3>
      </div>

      <div className="panel-body">
        {loading && (
          <div className="metadata-loading">
            <Loader2 size={16} className="spin-ring" />
            <span>{t.inspect.fetchingMetadata}</span>
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
              <label>{t.inspect.titleLabel}</label>
              <p>{metadata.title}</p>
            </div>

            {metadata.artist && (
              <div className="metadata-item">
                <label>{t.inspect.artist}</label>
                <p>{metadata.artist}</p>
              </div>
            )}

            {metadata.album && (
              <div className="metadata-item">
                <label>{t.inspect.album}</label>
                <p>{metadata.album}</p>
              </div>
            )}

            {metadata.releaseYear && (
              <div className="metadata-item">
                <label>{t.inspect.released}</label>
                <p>{metadata.releaseYear}</p>
              </div>
            )}

            {metadata.genres && metadata.genres.length > 0 && (
              <div className="metadata-item">
                <label>{t.inspect.genres}</label>
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
                  {t.inspect.viewOnSpotify}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="metadata-source">
              <small>{t.inspect.sourceLabel.replace("{source}", metadata.source)}</small>
            </div>
          </div>
        )}

        {!metadata && !loading && !error && (
          <div className="metadata-empty">
            <p>{t.inspect.noMetadataAvailable}</p>
          </div>
        )}
      </div>
    </div>
  );
}
