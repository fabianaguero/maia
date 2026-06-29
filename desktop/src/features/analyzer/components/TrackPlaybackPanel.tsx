import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import {
  describeTrackPlaybackSource,
  getTrackSourcePath,
  getTrackStoragePath,
  resolvePlayableTrackPath,
} from "../../../utils/track";
import { ManagedAudioPlayer, type ManagedAudioCueRequest } from "./ManagedAudioPlayer";

interface TrackPlaybackPanelProps {
  track: LibraryTrack;
  onTimeUpdate?: (seconds: number) => void;
  cueRequest?: ManagedAudioCueRequest | null;
  auditionLabel?: string | null;
}

function formatDuration(durationSeconds: number | null, pendingLabel: string): string {
  if (!durationSeconds) {
    return pendingLabel;
  }

  const rounded = Math.round(durationSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function TrackPlaybackPanel({
  track,
  onTimeUpdate,
  cueRequest,
  auditionLabel,
}: TrackPlaybackPanelProps) {
  const t = useT();
  const playableTrackPath = resolvePlayableTrackPath(track);
  const trackFormat = track.file.fileExtension.replace(/^\./, "").toUpperCase() || "AUDIO";

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.trackPlayback}</h2>
          <p className="support-copy">{t.inspect.trackPlaybackCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.playbackSource}</span>
          <strong>{describeTrackPlaybackSource(track)}</strong>
        </div>
        <div>
          <span>{t.inspect.trackFile}</span>
          <strong>{trackFormat}</strong>
        </div>
        <div>
          <span>{t.inspect.duration}</span>
          <strong>{formatDuration(track.analysis.durationSeconds, t.inspect.pending)}</strong>
        </div>
        {auditionLabel ? (
          <div>
            <span>{t.inspect.compareCue}</span>
            <strong>{auditionLabel}</strong>
          </div>
        ) : null}
      </div>

      <div className="audio-path-card top-spaced">
        <span>{t.inspect.audioPath}</span>
        <strong>
          {getTrackStoragePath(track) ?? getTrackSourcePath(track) ?? t.inspect.noAudioPath}
        </strong>
      </div>

      <ManagedAudioPlayer
        title={t.inspect.trackTransport}
        description={t.inspect.trackTransportCopy}
        audioPath={playableTrackPath}
        durationSeconds={track.analysis.durationSeconds}
        playLabel={t.inspect.playTrack}
        pauseLabel={t.inspect.pauseTrack}
        missingNote={t.inspect.noTrackAudioPath}
        browserFallbackNote={t.inspect.trackBrowserFallback}
        desktopOnlyNote={t.inspect.trackDesktopOnly}
        availableNote={t.inspect.trackAvailableNote}
        errorNote={t.inspect.trackErrorNote}
        onTimeUpdate={onTimeUpdate}
        cueRequest={cueRequest}
      />
    </section>
  );
}
