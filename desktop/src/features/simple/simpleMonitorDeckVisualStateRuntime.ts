import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { buildSimpleMonitorDeckVisualDerivedState } from "./simpleMonitorDeckVisualRuntime";

export type SimpleMonitorDerivedDeckState = ReturnType<
  typeof buildSimpleMonitorDeckVisualDerivedState
>["derivedDeckState"];

export function buildMonitorOverviewRenderPlan(input: {
  safeRuntime: boolean;
  canvas: HTMLCanvasElement | null;
  derivedDeckState: SimpleMonitorDerivedDeckState;
  waveformAnomalies: WaveformAnomalyMarker[];
  deckVisualPreset: "passive" | "balanced" | "alert";
}) {
  if (input.safeRuntime || !input.canvas) {
    return null;
  }

  return {
    canvas: input.canvas,
    overviewWaveSamples: input.derivedDeckState.overviewWaveSamples,
    overviewAnomalyDensity: input.derivedDeckState.overviewAnomalyDensity,
    anomalyBurstRegions: input.derivedDeckState.anomalyBurstRegions,
    waveformAnomalies: input.waveformAnomalies,
    selectedDeckMarker: input.derivedDeckState.selectedDeckMarker,
    visualPreset: input.deckVisualPreset,
  };
}

export function buildMonitorWaveformRenderPlan(input: {
  safeRuntime: boolean;
  canvas: HTMLCanvasElement | null;
  stage: HTMLDivElement | null;
  trackWaveSamples: number[];
  derivedDeckState: SimpleMonitorDerivedDeckState;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckVisualPreset: "passive" | "balanced" | "alert";
}) {
  if (input.safeRuntime || !input.canvas || !input.stage) {
    return null;
  }

  return {
    canvas: input.canvas,
    stage: input.stage,
    trackWaveSamples: input.trackWaveSamples,
    logWaveOverlay: input.derivedDeckState.logWaveOverlay,
    anomalyBurstRegions: input.derivedDeckState.anomalyBurstRegions,
    selectedDeckMarker: input.derivedDeckState.selectedDeckMarker,
    waveformAnomalies: input.waveformAnomalies,
    trackWaveProgress: input.trackWaveProgress,
    visualPreset: input.deckVisualPreset,
  };
}
