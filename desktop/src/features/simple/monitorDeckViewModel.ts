export * from "./monitorDeckTypes";
export * from "./monitorDeckTimelineRuntime";
export * from "./monitorDeckWaveSamplingRuntime";
export {
  buildAnomalyBurstRegions,
  buildMonitorDeckDerivedState as buildMonitorDeckDerivedStateBase,
  sampleLogWaveOverlay,
  sampleOverviewAnomalyDensity,
} from "./monitorDeckAnomalyRuntime";
import { buildMonitorDeckDerivedState as buildMonitorDeckDerivedStateBase } from "./monitorDeckAnomalyRuntime";
import { sampleOverviewWave } from "./monitorDeckWaveSamplingRuntime";
import type { MonitorDeckDerivedState, WaveformAnomalyMarker } from "./monitorDeckTypes";

export function buildMonitorDeckDerivedState(input: {
  waveformBins: number[] | null | undefined;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  visibleWindowSeconds: number;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  nowMs?: number;
}): MonitorDeckDerivedState {
  return buildMonitorDeckDerivedStateBase({
    ...input,
    sampleOverviewWave,
  });
}
