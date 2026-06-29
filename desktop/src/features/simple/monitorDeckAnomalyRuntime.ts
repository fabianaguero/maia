import type {
  AnomalyBurstRegion,
  LogWaveOverlayPoint,
  MonitorDeckDerivedState,
  OverviewAnomalyDensityPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckTypes";
import { MONITOR_TRACK_WINDOW_POINTS } from "./monitorDeckTypes";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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

export function buildMonitorDeckDerivedState({
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  deckDurationSeconds,
  visibleWindowSeconds,
  logSignalBuffer,
  selectedAnomalyId,
  sampleOverviewWave,
}: {
  waveformBins: number[] | null | undefined;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  visibleWindowSeconds: number;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  sampleOverviewWave: (bins: number[] | null | undefined) => number[];
}): MonitorDeckDerivedState {
  const overviewWaveSamples = sampleOverviewWave(waveformBins ?? null);
  const overviewAnomalyDensity = sampleOverviewAnomalyDensity(waveformAnomalies);
  const anomalyBurstRegions = buildAnomalyBurstRegions(waveformAnomalies);
  const overviewWindowWidthPercent =
    typeof deckDurationSeconds === "number" && deckDurationSeconds > 0
      ? Math.min(100, (visibleWindowSeconds / deckDurationSeconds) * 100)
      : 0;
  const overviewWindowLeftPercent =
    typeof deckDurationSeconds === "number" && deckDurationSeconds > 0
      ? Math.max(
          0,
          Math.min(
            100 - overviewWindowWidthPercent,
            trackWaveProgress * 100 - overviewWindowWidthPercent / 2,
          ),
        )
      : 0;
  const overviewPlayheadLeftPercent =
    overviewWindowWidthPercent > 0
      ? overviewWindowLeftPercent + overviewWindowWidthPercent / 2
      : trackWaveProgress * 100;
  const logWaveOverlay = sampleLogWaveOverlay(logSignalBuffer);
  const overviewAnomalyMarkers = waveformAnomalies
    .map((marker) => ({
      ...marker,
      leftPercent: marker.progress * 100,
    }))
    .filter((marker) => marker.leftPercent >= 0 && marker.leftPercent <= 100);
  const selectedDeckMarker = selectedAnomalyId
    ? (waveformAnomalies.find((marker) => marker.id === selectedAnomalyId) ?? null)
    : null;
  const selectedBurstRegion = selectedDeckMarker
    ? (anomalyBurstRegions.find(
        (region) =>
          selectedDeckMarker.progress >= region.startProgress &&
          selectedDeckMarker.progress <= region.endProgress,
      ) ?? null)
    : null;

  return {
    overviewWaveSamples,
    overviewAnomalyDensity,
    anomalyBurstRegions,
    overviewWindowWidthPercent,
    overviewWindowLeftPercent,
    overviewPlayheadLeftPercent,
    logWaveOverlay,
    overviewAnomalyMarkers,
    selectedDeckMarker,
    selectedBurstRegion,
  };
}
