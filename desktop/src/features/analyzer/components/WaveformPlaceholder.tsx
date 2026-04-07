import type { CSSProperties } from "react";
import type { BeatGridPoint } from "../../../types/library";

interface WaveformPlaceholderProps {
  bins: number[];
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  hotCues?: Array<{
    second: number;
    label: string;
    type: string;
    excerpt?: string;
  }>;
  currentTime?: number;
  hero?: boolean;
  onSeek?: (second: number) => void;
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function WaveformPlaceholder({
  bins,
  beatGrid,
  durationSeconds,
  hotCues = [],
  currentTime = 0,
  hero = false,
  onSeek,
}: WaveformPlaceholderProps) {
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !durationSeconds || durationSeconds <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * durationSeconds;
    onSeek(seekTime);
  };
  // Use bins as-is; if empty, create a fallback with more detail
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 128 }, (_, index) => {
          const cycle = (index % 16) / 16;
          return Number((0.3 + Math.sin(cycle * Math.PI) * 0.6).toFixed(3));
        });

  // Ensure we have enough bins for hi-res display (at least 128, up to 512)
  const displayBins = normalizedBins.length < 128
    ? Array.from({ length: 128 }, (_, i) =>
        normalizedBins[Math.floor((i / 128) * normalizedBins.length)] || 0.3
      )
    : normalizedBins;

  const visibleBeats =
    durationSeconds && durationSeconds > 0
      ? beatGrid.filter((beat) => beat.second >= 0 && beat.second <= durationSeconds)
      : [];

  return (
    <section className={`panel waveform-panel${hero ? " waveform-panel--hero" : ""}`}>
      <div className="panel-header">
        <div>
          <h2>Waveform + beat grid</h2>
          <p className="support-copy">
            The analyzer currently persists coarse waveform bins for immediate
            review, plus beat markers positioned over the local timeline.
          </p>
        </div>
      </div>

      <div
        className="waveform-stage"
        onClick={handleWaveformClick}
        style={{ cursor: onSeek ? 'pointer' : 'default' }}
      >
        <div
          className="waveform-bars"
          aria-label="Waveform overview"
          style={{
            gridTemplateColumns: `repeat(${displayBins.length}, minmax(0, 1fr))`,
          } as CSSProperties}
        >
          {displayBins.map((bin, index) => (
            <span
              key={`${index}-${bin}`}
              className="waveform-bar"
              style={{ "--bar-scale": String(bin) } as CSSProperties}
            />
          ))}
        </div>

        <div className="beat-grid-overlay" aria-label="Beat grid markers">
          {visibleBeats.map((beat) => {
            const position =
              durationSeconds && durationSeconds > 0
                ? Math.min(100, (beat.second / durationSeconds) * 100)
                : 0;

            return (
              <span
                key={`${beat.index}-${beat.second}`}
                className="beat-grid-marker"
                style={{ "--beat-position": `${position}%` } as CSSProperties}
                title={`Beat ${beat.index + 1} at ${beat.second.toFixed(2)}s`}
              />
            );
          })}
        </div>

        <div className="hot-cue-overlay" aria-label="Anomaly markers">
          {hotCues.map((cue, index) => {
            const position =
              durationSeconds && durationSeconds > 0
                ? Math.min(100, (cue.second / durationSeconds) * 100)
                : 0;

            return (
              <span
                key={`${index}-${cue.second}`}
                className={`hot-cue-marker ${cue.label.toLowerCase()}`}
                style={{ "--cue-position": `${position}%` } as CSSProperties}
                title={`${cue.label}: ${cue.excerpt}`}
              >
                <span className="hot-cue-label">{cue.label}</span>
              </span>
            );
          })}
        </div>

        <div className="waveform-playhead-overlay" aria-hidden="true">
          {durationSeconds && durationSeconds > 0 ? (
            <div
              className="waveform-progress-mask"
              style={{
                width: `${Math.min(100, (currentTime / durationSeconds) * 100)}%`,
              } as CSSProperties}
            />
          ) : null}
          {durationSeconds && durationSeconds > 0 ? (
            <div
              className="waveform-playhead"
              style={{
                left: `${Math.min(100, (currentTime / durationSeconds) * 100)}%`,
              } as CSSProperties}
            />
          ) : null}
        </div>
      </div>

      <div className="waveform-summary">
        <div className="waveform-meta-pill">
          <span>Visible beats</span>
          <strong>{visibleBeats.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Resolution</span>
          <strong>{displayBins.length} bins</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Grid state</span>
          <strong>{visibleBeats.length > 0 ? "Aligned" : "Pending"}</strong>
        </div>
      </div>

      <div className="waveform-footer">
        <span>00:00</span>
        <span>{formatDuration(durationSeconds)}</span>
      </div>
    </section>
  );
}
