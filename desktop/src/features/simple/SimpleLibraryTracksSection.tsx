import { Pause, Play, Zap } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { LibraryTrack } from "../../types/library";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";

interface SimpleLibraryTracksSectionProps {
  tracks: LibraryTrack[];
  trackCount: number;
  selectedTrackId: string | null;
  previewTrackId: string | null;
  t: AppTranslations;
  onSelectTrack: (trackId: string) => void;
  onToggleTrackPreview: (track: LibraryTrack) => Promise<void> | void;
}

export function SimpleLibraryTracksSection({
  tracks,
  trackCount,
  selectedTrackId,
  previewTrackId,
  t,
  onSelectTrack,
  onToggleTrackPreview,
}: SimpleLibraryTracksSectionProps) {
  return (
    <section className="simple-library-section">
      <h3 className="simple-section-title">
        <Zap size={18} />
        {t.simpleMode.library.soundPresets} ({trackCount})
      </h3>
      <div className="simple-assets-grid">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`simple-asset-card ${selectedTrackId === track.id ? "selected" : ""}`}
            onClick={() => onSelectTrack(track.id)}
          >
            <div className="simple-asset-info">
              <span className="simple-asset-name">{track.tags.title}</span>
              <p className="simple-asset-desc">
                {track.tags.musicStyleLabel || t.simpleMode.library.presetFallback}
              </p>
            </div>
            <button
              type="button"
              className="track-preview-button"
              title={
                previewTrackId === track.id
                  ? t.simpleMode.setup.pausePreview
                  : t.simpleMode.setup.previewTrack
              }
              onClick={(event) => {
                event.stopPropagation();
                void onToggleTrackPreview(track);
              }}
            >
              {previewTrackId === track.id ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <div className="simple-asset-wave-preview">
              <TrackWaveformMini
                bins={track.analysis?.waveformBins ?? null}
                active={selectedTrackId === track.id}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
