import type {
  LogWaveOverlayPoint,
  OverviewAnomalyDensityPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckTypes";
import { MONITOR_TRACK_WINDOW_POINTS } from "./monitorDeckTypes";

export function sampleOverviewAnomalyDensity(
  markers: WaveformAnomalyMarker[],
  points = 160,
): OverviewAnomalyDensityPoint[] {
  if (markers.length === 0) {
    return Array.from({ length: points }, () => ({ warning: 0, critical: 0 }));
  }

  return Array.from({ length: points }, (_, index) => {
    const progress = index / Math.max(1, points - 1);
    let warning = 0;
    let critical = 0;

    markers.forEach((marker) => {
      const distance = Math.abs(marker.progress - progress);
      if (distance > 0.08) {
        return;
      }

      const falloff = Math.max(0, 1 - distance / 0.08);
      const weight = falloff * falloff * (0.45 + marker.severity * 0.55);
      if (marker.severity >= 0.9) {
        critical += weight;
      } else {
        warning += weight;
      }
    });

    return {
      warning: Math.min(1, warning),
      critical: Math.min(1, critical),
    };
  });
}

export function sampleLogWaveOverlay(
  buffer: Array<{ val: number; heat: number }>,
  points = MONITOR_TRACK_WINDOW_POINTS,
): LogWaveOverlayPoint[] {
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => ({ level: 0.08, heat: 0 }));
  }

  return Array.from({ length: points }, (_, index) => {
    const sourceIndex = (index / Math.max(1, points - 1)) * Math.max(0, buffer.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(buffer.length - 1, leftIndex + 1);
    const ratio = sourceIndex - leftIndex;
    const left = buffer[leftIndex] ?? { val: 20, heat: 0 };
    const right = buffer[rightIndex] ?? left;
    const value = left.val + (right.val - left.val) * ratio;
    const heat = left.heat + (right.heat - left.heat) * ratio;

    return {
      level: Math.max(0.04, Math.min(1, value / 140)),
      heat: Math.max(0, Math.min(1, heat)),
    };
  });
}
