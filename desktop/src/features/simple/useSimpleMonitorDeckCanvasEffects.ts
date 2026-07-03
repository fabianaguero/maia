import { useEffect } from "react";

import { renderMonitorDeckCanvas, renderMonitorOverviewCanvas } from "./monitorDeckCanvas";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorDeckCanvasEffectsPlans,
  type BuildMonitorDeckCanvasEffectsPlansInput,
} from "./simpleMonitorDeckCanvasEffectsRuntime";
import type { SimpleMonitorDerivedDeckState } from "./simpleMonitorDeckVisualStateRuntime";

interface UseSimpleMonitorDeckCanvasEffectsInput {
  overviewCanvasRef: { current: HTMLCanvasElement | null };
  waveformCanvasRef: { current: HTMLCanvasElement | null };
  waveformStageRef: { current: HTMLDivElement | null };
  derivedDeckState: SimpleMonitorDerivedDeckState;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveSamples: number[];
  trackWaveProgress: number;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime: boolean;
}

export function useSimpleMonitorDeckCanvasEffects({
  overviewCanvasRef,
  waveformCanvasRef,
  waveformStageRef,
  derivedDeckState,
  waveformAnomalies,
  trackWaveSamples,
  trackWaveProgress,
  deckVisualPreset,
  waveformScale: _waveformScale,
  safeRuntime,
}: UseSimpleMonitorDeckCanvasEffectsInput): void {
  useEffect(() => {
    const { overviewPlan } = buildMonitorDeckCanvasEffectsPlans({
      safeRuntime,
      overviewCanvas: overviewCanvasRef.current,
      waveformCanvas: waveformCanvasRef.current,
      waveformStage: waveformStageRef.current,
      derivedDeckState,
      waveformAnomalies,
      trackWaveSamples,
      trackWaveProgress,
      deckVisualPreset,
    } satisfies BuildMonitorDeckCanvasEffectsPlansInput);
    if (!overviewPlan) {
      return;
    }

    renderMonitorOverviewCanvas(overviewPlan);
  }, [
    deckVisualPreset,
    derivedDeckState,
    overviewCanvasRef,
    trackWaveProgress,
    trackWaveSamples,
    safeRuntime,
    waveformCanvasRef,
    waveformAnomalies,
    waveformStageRef,
  ]);

  useEffect(() => {
    const { waveformPlan } = buildMonitorDeckCanvasEffectsPlans({
      safeRuntime,
      overviewCanvas: overviewCanvasRef.current,
      waveformCanvas: waveformCanvasRef.current,
      waveformStage: waveformStageRef.current,
      derivedDeckState,
      waveformAnomalies,
      trackWaveSamples,
      trackWaveProgress,
      deckVisualPreset,
    } satisfies BuildMonitorDeckCanvasEffectsPlansInput);
    if (!waveformPlan) {
      return;
    }

    renderMonitorDeckCanvas(waveformPlan);
  }, [
    deckVisualPreset,
    derivedDeckState,
    overviewCanvasRef,
    safeRuntime,
    trackWaveProgress,
    trackWaveSamples,
    waveformAnomalies,
    waveformCanvasRef,
    waveformStageRef,
  ]);
}
