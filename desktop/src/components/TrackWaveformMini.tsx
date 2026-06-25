interface TrackWaveformMiniProps {
  bins?: number[] | null;
  active?: boolean;
}

function sampleBins(bins: number[] | null | undefined, points = 56): number[] {
  if (!bins || bins.length === 0) {
    return Array.from({ length: points }, (_, index) => {
      const phase = index / points;
      return 0.18 + Math.sin(phase * Math.PI * 6) * 0.08 + (index % 5 === 0 ? 0.12 : 0);
    });
  }

  const max = Math.max(...bins, 1);
  return Array.from({ length: points }, (_, index) => {
    const sourceIndex = Math.floor((index / points) * bins.length);
    const value = bins[Math.min(sourceIndex, bins.length - 1)] ?? 0;
    return Math.max(0.04, Math.min(1, value / max));
  });
}

export function TrackWaveformMini({ bins, active = false }: TrackWaveformMiniProps) {
  const samples = sampleBins(bins);

  return (
    <div className={`track-waveform-mini ${active ? "active" : ""}`} aria-hidden="true">
      {samples.map((value, index) => {
        const height = `${Math.max(8, value * 100)}%`;
        return <span key={index} className="track-waveform-mini__bar" style={{ height }} />;
      })}
    </div>
  );
}
