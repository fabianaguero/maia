import { ManagedAudioPlayerControls } from "./ManagedAudioPlayerControls";
import { useManagedAudioPlayerController } from "./useManagedAudioPlayerController";

export interface ManagedAudioCueRequest {
  id: number;
  second: number;
  autoplay?: boolean;
}

interface ManagedAudioPlayerProps {
  title: string;
  description: string;
  audioPath: string | null;
  durationSeconds: number | null;
  playLabel: string;
  pauseLabel: string;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
  errorNote: string;
  onTimeUpdate?: (seconds: number) => void;
  cueRequest?: ManagedAudioCueRequest | null;
}

export function ManagedAudioPlayer({
  title,
  description,
  audioPath,
  durationSeconds,
  playLabel,
  pauseLabel,
  missingNote,
  browserFallbackNote,
  desktopOnlyNote,
  availableNote,
  errorNote,
  onTimeUpdate,
  cueRequest,
}: ManagedAudioPlayerProps) {
  const {
    audioRef,
    playbackState,
    playbackError,
    currentTimeSeconds,
    volume,
    shownDurationSeconds,
    scrubberRange,
    canPlayAudio,
    note,
    handleTogglePlayback,
    handleSeek,
    handleVolumeChange,
  } = useManagedAudioPlayerController({
    audioPath,
    durationSeconds,
    errorNote,
    missingNote,
    browserFallbackNote,
    desktopOnlyNote,
    availableNote,
    onTimeUpdate,
    cueRequest,
  });

  return (
    <div className="render-audio-player top-spaced">
      <div className="panel-header compact">
        <div>
          <h2>{title}</h2>
          <p className="support-copy">{description}</p>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />

      <ManagedAudioPlayerControls
        title={title}
        playbackState={playbackState}
        currentTimeSeconds={currentTimeSeconds}
        shownDurationSeconds={shownDurationSeconds}
        volume={volume}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        toggleDisabled={!canPlayAudio || playbackState === "loading"}
        onTogglePlayback={handleTogglePlayback}
        onVolumeChange={handleVolumeChange}
      />

      <input
        type="range"
        className="render-audio-scrubber"
        min={0}
        max={scrubberRange.max}
        step={0.01}
        value={scrubberRange.value}
        onChange={handleSeek}
        disabled={!canPlayAudio || !shownDurationSeconds}
        aria-label={`${title} scrubber`}
      />

      <p className="render-audio-note">{playbackError ?? note}</p>
    </div>
  );
}
