import type { LibraryTrack } from "../../../types/library";
import { ManagedAudioPlayer } from "./ManagedAudioPlayer";

interface TrackPlaybackPanelProps {
  track: LibraryTrack;
  onTimeUpdate?: (seconds: number) => void;
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
  if (!track.storagePath && !track.sourcePath) {
    return "Unavailable";
  }

  if (
    track.storagePath?.startsWith("browser-fallback://") ||
    track.sourcePath?.startsWith("browser-fallback://")
  ) {
    return "Browser fallback";
  }

  if (track.storagePath && track.storagePath !== track.sourcePath) {
    return "Managed snapshot";
  }

  return "Original file";
}

function resolvePlayableTrackPath(track: LibraryTrack): string | null {
  // Prefer the managed snapshot; fall back to the original source path.
  if (track.storagePath && !track.storagePath.startsWith("browser-fallback://")) {
    return track.storagePath;
  }

  if (track.sourcePath && !track.sourcePath.startsWith("browser-fallback://")) {
    return track.sourcePath;
  }

  return null;
}

export function TrackPlaybackPanel({ track, onTimeUpdate }: TrackPlaybackPanelProps) {
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
        <span>Audio path</span>
        <strong>{track.storagePath ?? track.sourcePath ?? "No audio path"}</strong>
      </div>

      <ManagedAudioPlayer
        title="Track transport"
        description="Cue and audition the managed track audio without leaving the analyzer screen."
        audioPath={playableTrackPath}
        durationSeconds={track.durationSeconds}
        playLabel="Play track"
        pauseLabel="Pause track"
        missingNote="No audio path found for this track. Re-import it to enable playback."
        browserFallbackNote="Browser fallback simulates track storage. Open the Tauri desktop shell to audition the managed track."
        desktopOnlyNote="Managed track playback is available inside the desktop shell."
        availableNote="Track playback runs from the managed local snapshot stored by Maia."
        errorNote="Maia could not read the managed track snapshot. Re-import the track if the file is missing."
        onTimeUpdate={onTimeUpdate}
      />
    </section>
  );
}
