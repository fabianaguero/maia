import type { CSSProperties } from "react";

interface WaveformPlaceholderProps {
  bins: number[];
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
  durationSeconds,
}: WaveformPlaceholderProps) {
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 56 }, (_, index) =>
          Number((0.25 + ((index % 9) + 1) / 18).toFixed(3)),
        );

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Waveform placeholder</h2>
          <p className="support-copy">
            Placeholder bars only. Advanced waveform rendering is intentionally
            out of scope for this pass.
          </p>
        </div>
      </div>

      <div className="waveform-stage" aria-label="Placeholder waveform bars">
        {normalizedBins.map((bin, index) => (
          <span
            key={`${index}-${bin}`}
            className="waveform-bar"
            style={{ "--bar-scale": String(bin) } as CSSProperties}
          />
        ))}
      </div>

      <div className="waveform-footer">
        <span>00:00</span>
        <span>{formatDuration(durationSeconds)}</span>
      </div>
    </section>
  );
}
