export function sampleTrackWaveformMiniBins(
  bins: number[] | null | undefined,
  points = 56,
): number[] {
  if (!bins || bins.length === 0) {
    return Array.from({ length: points }, (_, index) => {
      const phase = index / points;
      return 0.18 + Math.sin(phase * Math.PI * 6) * 0.08 + (index % 5 === 0 ? 0.12 : 0);
    });
  }

  const normalizedBins = Array.from({ length: bins.length }, (_, index) =>
    Number.isFinite(bins[index]) ? bins[index] : 0,
  );
  const max = Math.max(...normalizedBins, 1);
  return Array.from({ length: points }, (_, index) => {
    const sourceIndex = Math.floor((index / points) * normalizedBins.length);
    const value = normalizedBins[Math.min(sourceIndex, normalizedBins.length - 1)] ?? 0;
    return Math.max(0.04, Math.min(1, value / max));
  });
}
