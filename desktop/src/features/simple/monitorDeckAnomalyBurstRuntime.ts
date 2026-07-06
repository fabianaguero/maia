import type { AnomalyBurstRegion, WaveformAnomalyMarker } from "./monitorDeckTypes";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function buildAnomalyBurstRegions(
  markers: WaveformAnomalyMarker[],
  gapThreshold = 0.03,
  padding = 0.008,
): AnomalyBurstRegion[] {
  if (markers.length === 0) {
    return [];
  }

  const sorted = [...markers].sort((left, right) => left.progress - right.progress);
  const regions: AnomalyBurstRegion[] = [];

  let current = {
    start: sorted[0]!.progress,
    end: sorted[0]!.progress,
    severity: sorted[0]!.severity,
    count: 1,
  };

  for (let index = 1; index < sorted.length; index += 1) {
    const marker = sorted[index]!;
    if (marker.progress - current.end <= gapThreshold) {
      current.end = marker.progress;
      current.severity = Math.max(current.severity, marker.severity);
      current.count += 1;
      continue;
    }

    regions.push({
      id: `burst-${regions.length}-${current.start.toFixed(4)}`,
      startProgress: clamp01(current.start - padding),
      endProgress: clamp01(current.end + padding),
      severity: current.severity,
      count: current.count,
    });

    current = {
      start: marker.progress,
      end: marker.progress,
      severity: marker.severity,
      count: 1,
    };
  }

  regions.push({
    id: `burst-${regions.length}-${current.start.toFixed(4)}`,
    startProgress: clamp01(current.start - padding),
    endProgress: clamp01(current.end + padding),
    severity: current.severity,
    count: current.count,
  });

  return regions;
}
