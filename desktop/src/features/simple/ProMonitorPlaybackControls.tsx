import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface ProMonitorPlaybackControlsProps {
  isPlaying: boolean;
  isLiveMode: boolean;
  playLabel: string;
  pauseLabel: string;
  skipBackLabel: string;
  skipForwardLabel: string;
  liveLabel: string;
  playbackLabel: string;
  onTogglePlayback: () => void;
}

export function ProMonitorPlaybackControls({
  isPlaying,
  isLiveMode,
  playLabel,
  pauseLabel,
  skipBackLabel,
  skipForwardLabel,
  liveLabel,
  playbackLabel,
  onTogglePlayback,
}: ProMonitorPlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button
        type="button"
        className="btn-playback"
        onClick={onTogglePlayback}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? pauseLabel : playLabel}
        title={isPlaying ? pauseLabel : playLabel}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <button
        type="button"
        className="btn-playback"
        title={skipBackLabel}
        aria-label={skipBackLabel}
      >
        <SkipBack size={20} />
      </button>
      <button
        type="button"
        className="btn-playback"
        title={skipForwardLabel}
        aria-label={skipForwardLabel}
      >
        <SkipForward size={20} />
      </button>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: "45%" }}></div>
      </div>

      <div className="mode-badges">
        <span className={`badge-mode ${isLiveMode ? "active" : ""}`}>{liveLabel}</span>
        <span className={`badge-mode ${!isLiveMode ? "active" : ""}`}>{playbackLabel}</span>
      </div>
    </div>
  );
}
