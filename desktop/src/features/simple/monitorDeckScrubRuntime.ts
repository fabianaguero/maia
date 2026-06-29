import { MONITOR_TRACK_STRIP_MULTIPLIER } from "./monitorDeckCanvasRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export function clampMonitorProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function resolveNearestMonitorAnomalyMarker(
  markers: WaveformAnomalyMarker[],
  progress: number,
): WaveformAnomalyMarker | null {
  return markers.reduce<WaveformAnomalyMarker | null>((closest, marker) => {
    if (!closest) {
      return marker;
    }

    return Math.abs(marker.progress - progress) < Math.abs(closest.progress - progress)
      ? marker
      : closest;
  }, null);
}

export function shouldFocusMonitorAnomalyMarker(
  marker: WaveformAnomalyMarker | null,
  progress: number,
  threshold = 0.03,
): boolean {
  return Boolean(marker && Math.abs(marker.progress - progress) <= threshold);
}

export function resolveOverviewScrubProgress(input: {
  clientX: number;
  left: number;
  width: number;
}): number {
  return clampMonitorProgress((input.clientX - input.left) / input.width);
}

export function resolveDeckScrubProgress(input: {
  clientX: number;
  left: number;
  width: number;
  startRatio: number;
  startProgress: number;
}): number {
  const pointerRatio = clampMonitorProgress((input.clientX - input.left) / input.width);
  const rawDeltaRatio = pointerRatio - input.startRatio;
  const signedCurve = Math.sign(rawDeltaRatio) * Math.pow(Math.abs(rawDeltaRatio), 1.35);
  const delta = signedCurve / (MONITOR_TRACK_STRIP_MULTIPLIER * 0.82);

  return clampMonitorProgress(input.startProgress + delta);
}
