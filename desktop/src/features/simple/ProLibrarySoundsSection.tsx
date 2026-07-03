import { AudioWaveform, Eye, Trash2 } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { LibraryTrack } from "../../types/library";
import { formatBpmLabel } from "../../utils/monitorLabels";
import { getTrackTitle } from "../../utils/track";

interface ProLibrarySoundsSectionProps {
  tracks: LibraryTrack[];
  t: AppTranslations;
}

export function ProLibrarySoundsSection({ tracks, t }: ProLibrarySoundsSectionProps) {
  return (
    <div className="sounds-section">
      <div className="sources-list">
        {tracks.map((track) => (
          <div key={track.id} className="source-item">
            <div className="source-icon">
              <AudioWaveform size={18} className="text-cyan-400" />
            </div>
            <div className="source-info">
              <div className="source-header">
                <span className="source-name">{getTrackTitle(track)}</span>
                {track.analysis.bpm ? (
                  <span className="status-badge badge-ready">
                    {formatBpmLabel(track.analysis.bpm)}
                  </span>
                ) : (
                  <span className="status-badge badge-pending">{t.simpleMode.status.loading}</span>
                )}
              </div>
              <code className="source-path">{track.file.sourcePath}</code>
              <span className="source-date">
                {track.tags.musicStyleLabel} · {track.file.fileExtension.toUpperCase()}
              </span>
            </div>
            <div className="source-actions">
              <button className="btn-ghost" title={t.library.view}>
                <Eye size={14} />
              </button>
              <button className="btn-ghost btn-danger" title={t.library.deleteTrack}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
