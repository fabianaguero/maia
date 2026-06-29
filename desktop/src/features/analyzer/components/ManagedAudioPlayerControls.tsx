import type { ChangeEvent } from "react";

import { useT } from "../../../i18n/I18nContext";
import {
  describeManagedAudioState,
  formatManagedAudioDuration,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";

interface ManagedAudioPlayerControlsProps {
  title: string;
  playbackState: ManagedAudioPlaybackState;
  currentTimeSeconds: number;
  shownDurationSeconds: number | null;
  volume: number;
  playLabel: string;
  pauseLabel: string;
  toggleDisabled: boolean;
  onTogglePlayback: () => void | Promise<void>;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ManagedAudioPlayerControls({
  title,
  playbackState,
  currentTimeSeconds,
  shownDurationSeconds,
  volume,
  playLabel,
  pauseLabel,
  toggleDisabled,
  onTogglePlayback,
  onVolumeChange,
}: ManagedAudioPlayerControlsProps) {
  const t = useT();

  return (
    <div className="render-audio-controls">
      <button
        type="button"
        className={playbackState === "playing" ? "secondary-action" : "action"}
        onClick={() => void onTogglePlayback()}
        disabled={toggleDisabled}
      >
        {playbackState === "playing" ? pauseLabel : playLabel}
      </button>
      <div className="render-audio-status">
        <span>{t.inspect.transportStatus}</span>
        <strong>{describeManagedAudioState(playbackState, t)}</strong>
      </div>
      <div className="render-audio-status">
        <span>{t.inspect.transportPosition}</span>
        <strong>
          {formatManagedAudioDuration(currentTimeSeconds)} /{" "}
          {formatManagedAudioDuration(shownDurationSeconds)}
        </strong>
      </div>
      <div className="render-audio-volume">
        <span>{t.inspect.transportVolume}</span>
        <div className="volume-bars">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`volume-bar${volume > i / 10 ? " active" : ""}`}
              style={{ opacity: volume > i / 10 ? 1 : 0.2 }}
              aria-hidden="true"
            />
          ))}
        </div>
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={onVolumeChange}
          aria-label={`${title} volume`}
        />
        <strong>{Math.round(volume * 100)}%</strong>
      </div>
    </div>
  );
}
