import { sampleTrackWaveformMiniBins } from "./trackWaveformMiniViewModel";

interface TrackWaveformMiniProps {
  bins?: number[] | null;
  active?: boolean;
}

export function TrackWaveformMini({ bins, active = false }: TrackWaveformMiniProps) {
  const samples = sampleTrackWaveformMiniBins(bins);

  return (
    <div className={`track-waveform-mini ${active ? "active" : ""}`} aria-hidden="true">
      {samples.map((value, index) => {
        const height = `${Math.max(8, value * 100)}%`;
        return <span key={index} className="track-waveform-mini__bar" style={{ height }} />;
      })}
    </div>
  );
}
