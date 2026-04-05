import type { LibraryTrack } from "../../../types/library";
import { ManagedAudioPlayer } from "./ManagedAudioPlayer";

interface TrackPlaybackPanelProps {
  track: LibraryTrack;
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "Pending";
  }

  const rounded = Math.round(durationSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function describePlaybackSource(track: LibraryTrack): string {
  if (!track.storagePath) {
    return "Unavailable";
  }

  if (track.storagePath.startsWith("browser-fallback://")) {
    return "Browser fallback";
  }

  if (track.storagePath === track.sourcePath) {
    return "Legacy/original path";
  }

  return "Managed snapshot";
}

function resolvePlayableTrackPath(track: LibraryTrack): string | null {
  if (!track.storagePath || track.storagePath === track.sourcePath) {
    return null;
  }

  return track.storagePath;
}

export function TrackPlaybackPanel({ track }: TrackPlaybackPanelProps) {
  const playableTrackPath = resolvePlayableTrackPath(track);
  const trackFormat = track.fileExtension.replace(/^\./, "").toUpperCase() || "AUDIO";

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>Track playback</h2>
          <p className="support-copy">
            Audition the managed local track snapshot directly inside Maia while reviewing waveform
            and BPM artifacts.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Playback source</span>
          <strong>{describePlaybackSource(track)}</strong>
        </div>
        <div>
          <span>Track file</span>
          <strong>{trackFormat}</strong>
        </div>
        <div>
          <span>Duration</span>
          <strong>{formatDuration(track.durationSeconds)}</strong>
        </div>
      </div>

      <div className="audio-path-card top-spaced">
        <span>Managed audio path</span>
        <strong>{track.storagePath ?? "No managed snapshot created"}</strong>
      </div>

      <ManagedAudioPlayer
        title="Track transport"
        description="Cue and audition the managed track audio without leaving the analyzer screen."
        audioPath={playableTrackPath}
        durationSeconds={track.durationSeconds}
        playLabel="Play track"
        pauseLabel="Pause track"
        missingNote="This track does not have a managed Maia snapshot yet. Re-import it to enable in-app playback."
        browserFallbackNote="Browser fallback simulates track storage. Open the Tauri desktop shell to audition the managed track."
        desktopOnlyNote="Managed track playback is available inside the desktop shell."
        availableNote="Track playback runs from the managed local snapshot stored by Maia."
        errorNote="Maia could not read the managed track snapshot. Re-import the track if the file is missing."
      />
    </section>
  );
}
