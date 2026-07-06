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
