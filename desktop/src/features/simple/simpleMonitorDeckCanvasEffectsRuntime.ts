import {
  buildMonitorOverviewRenderPlan,
  buildMonitorWaveformRenderPlan,
  type SimpleMonitorDerivedDeckState,
} from "./simpleMonitorDeckVisualStateRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface BuildMonitorDeckCanvasEffectsPlansInput {
  safeRuntime: boolean;
  overviewCanvas: HTMLCanvasElement | null;
  waveformCanvas: HTMLCanvasElement | null;
  waveformStage: HTMLDivElement | null;
  derivedDeckState: SimpleMonitorDerivedDeckState;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveSamples: number[];
  trackWaveProgress: number;
  deckVisualPreset: "passive" | "balanced" | "alert";
}

export function buildMonitorDeckCanvasEffectsPlans(input: BuildMonitorDeckCanvasEffectsPlansInput) {
  return {
    overviewPlan: buildMonitorOverviewRenderPlan({
      safeRuntime: input.safeRuntime,
      canvas: input.overviewCanvas,
      derivedDeckState: input.derivedDeckState,
      waveformAnomalies: input.waveformAnomalies,
      deckVisualPreset: input.deckVisualPreset,
    }),
    waveformPlan: buildMonitorWaveformRenderPlan({
      safeRuntime: input.safeRuntime,
      canvas: input.waveformCanvas,
      stage: input.waveformStage,
      trackWaveSamples: input.trackWaveSamples,
      derivedDeckState: input.derivedDeckState,
      waveformAnomalies: input.waveformAnomalies,
      trackWaveProgress: input.trackWaveProgress,
      deckVisualPreset: input.deckVisualPreset,
    }),
  };
}
