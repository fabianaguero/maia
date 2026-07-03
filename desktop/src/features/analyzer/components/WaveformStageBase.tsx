import type { CSSProperties } from "react";
import type { BeatGridGuideMarker } from "../../../utils/beatGrid";

interface WaveformStageBaseProps {
  displayBins: number[];
  visibleBeats: BeatGridGuideMarker[];
  durationSeconds: number | null;
  waveformOverviewLabel: string;
  beatGridMarkersLabel: string;
  beatAtSecondTitle: string;
}

export function WaveformStageBase({
  displayBins,
  visibleBeats,
  durationSeconds,
  waveformOverviewLabel,
  beatGridMarkersLabel,
  beatAtSecondTitle,
}: WaveformStageBaseProps) {
  return (
    <>
      <div
        className="waveform-bars"
        aria-label={waveformOverviewLabel}
        style={
          {
            gridTemplateColumns: `repeat(${displayBins.length}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        {displayBins.map((bin, index) => (
          <span
            key={`${index}-${bin}`}
            className="waveform-bar"
            style={{ "--bar-scale": String(bin) } as CSSProperties}
          />
        ))}
      </div>

      <div className="beat-grid-overlay" aria-label={beatGridMarkersLabel}>
        {visibleBeats.map((beat) => {
          const position =
            durationSeconds && durationSeconds > 0
              ? Math.min(100, (beat.second / durationSeconds) * 100)
              : 0;

          return (
            <span
              key={`${beat.index}-${beat.second}`}
              className={`beat-grid-marker is-${beat.emphasis}`}
              style={{ "--beat-position": `${position}%` } as CSSProperties}
              title={beatAtSecondTitle
                .replace("{label}", beat.label)
                .replace("{second}", beat.second.toFixed(2))}
            >
              {beat.emphasis !== "beat" ? (
                <span className="beat-grid-marker-label">{beat.label}</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </>
  );
}
