import type { DeckSelectedMarker, WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  drawAnomalyWash,
  drawDeckBurstRegions,
  drawSelectedMarkerBeam,
} from "./monitorDeckCanvasDrawRuntime";
import { fillHorizontalGradientRect } from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckOverlayLane(input: {
  context: CanvasRenderingContext2D;
  state: MonitorDeckMainCanvasState;
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  selectedDeckMarker: DeckSelectedMarker | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>;
}): void {
  const {
    context,
    state,
    anomalyBurstRegions,
    selectedDeckMarker,
    waveformAnomalies,
    trackWaveProgress,
    scene,
  } = input;
  const { palette, layout } = state;
  const { headerInset, footerInset, logBaseY, logAmplitude } = layout;
  const { width, height } = state.size;

  drawDeckBurstRegions({
    context,
    regions: anomalyBurstRegions,
    currentProgress: trackWaveProgress,
    width,
    logBaseY,
    logAmplitude,
    palette,
  });
  context.globalAlpha = 1;

  drawAnomalyWash(
    context,
    waveformAnomalies,
    trackWaveProgress,
    width,
    logBaseY,
    logAmplitude,
    palette,
  );

  drawSelectedMarkerBeam(
    context,
    selectedDeckMarker,
    trackWaveProgress,
    width,
    headerInset,
    height - headerInset - footerInset,
    palette,
  );

  fillHorizontalGradientRect(
    context,
    scene.overlay.playheadGlowRect,
    scene.overlay.playheadGlowStops,
  );
  context.globalAlpha = 1;
}
