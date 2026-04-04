import type { CSSProperties } from "react";
import type { BeatGridPoint } from "../../../types/library";

interface WaveformPlaceholderProps {
  bins: number[];
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
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
}: WaveformPlaceholderProps) {
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 56 }, (_, index) =>
          Number((0.25 + ((index % 9) + 1) / 18).toFixed(3)),
        );
  const visibleBeats =
    durationSeconds && durationSeconds > 0
      ? beatGrid.filter((beat) => beat.second >= 0 && beat.second <= durationSeconds)
      : [];

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Waveform + beat grid</h2>
          <p className="support-copy">
            The analyzer currently persists coarse waveform bins for immediate
            review, plus beat markers positioned over the local timeline.
          </p>
        </div>
      </div>

      <div className="waveform-stage">
        <div
          className="waveform-bars"
          aria-label="Waveform overview"
          style={{
            gridTemplateColumns: `repeat(${normalizedBins.length}, minmax(0, 1fr))`,
          } as CSSProperties}
        >
          {normalizedBins.map((bin, index) => (
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
      </div>

      <div className="waveform-summary">
        <div className="waveform-meta-pill">
          <span>Visible beats</span>
          <strong>{visibleBeats.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Bins</span>
          <strong>{normalizedBins.length}</strong>
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
