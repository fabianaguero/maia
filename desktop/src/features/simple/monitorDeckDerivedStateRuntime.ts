import type { MonitorDeckDerivedState, WaveformAnomalyMarker } from "./monitorDeckTypes";
import { buildAnomalyBurstRegions } from "./monitorDeckAnomalyBurstRuntime";
import {
  sampleLogWaveOverlay,
  sampleOverviewAnomalyDensity,
} from "./monitorDeckAnomalySamplingRuntime";

export function buildMonitorDeckDerivedState({
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  deckDurationSeconds,
  visibleWindowSeconds,
  logSignalBuffer,
  selectedAnomalyId,
  sampleOverviewWave,
  nowMs,
}: {
  waveformBins: number[] | null | undefined;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  visibleWindowSeconds: number;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  sampleOverviewWave: (bins: number[] | null | undefined) => number[];
  nowMs?: number;
}): MonitorDeckDerivedState {
  const streamWindowMs = 120_000;
  const displayWaveformAnomalies = waveformAnomalies
    .map((marker) =>
      typeof marker.observedAtMs === "number" && typeof nowMs === "number"
        ? {
            ...marker,
            progress: Math.max(0, 1 - (nowMs - marker.observedAtMs) / streamWindowMs),
          }
        : marker,
    )
    .filter((marker) => marker.progress > 0 && marker.progress <= 1);
  const overviewWaveSamples = sampleOverviewWave(waveformBins ?? null);
  const overviewAnomalyDensity = sampleOverviewAnomalyDensity(displayWaveformAnomalies);
  const anomalyBurstRegions = buildAnomalyBurstRegions(displayWaveformAnomalies);
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
  const overviewAnomalyMarkers = displayWaveformAnomalies
    .map((marker) => ({
      ...marker,
      leftPercent: marker.progress * 100,
    }))
    .filter((marker) => marker.leftPercent >= 0 && marker.leftPercent <= 100);
  const selectedDeckMarker = selectedAnomalyId
    ? (displayWaveformAnomalies.find((marker) => marker.id === selectedAnomalyId) ?? null)
    : null;
  const selectedBurstRegion = selectedDeckMarker
    ? (anomalyBurstRegions.find(
        (region) =>
          selectedDeckMarker.progress >= region.startProgress &&
          selectedDeckMarker.progress <= region.endProgress,
      ) ?? null)
    : null;

  return {
    waveformAnomalies: displayWaveformAnomalies,
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
