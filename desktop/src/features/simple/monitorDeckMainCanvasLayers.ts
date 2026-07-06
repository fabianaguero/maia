import type { DeckSelectedMarker, WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";
import {
  drawMonitorDeckBackgroundLane,
  drawMonitorDeckLogLane,
  drawMonitorDeckOverlayLane,
  drawMonitorDeckTrackLane,
} from "./monitorDeckMainCanvasPaintRuntime";

export interface DrawMonitorDeckCanvasLayersInput {
  context: CanvasRenderingContext2D;
  state: MonitorDeckMainCanvasState;
  width: number;
  height: number;
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  selectedDeckMarker: DeckSelectedMarker | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
}

export function sizeMonitorDeckCanvas(
  canvas: HTMLCanvasElement,
  size: MonitorDeckMainCanvasState["size"],
): void {
  canvas.width = Math.floor(size.width * size.dpr);
  canvas.height = Math.floor(size.height * size.dpr);
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
}

export function drawMonitorDeckCanvasLayers({
  context,
  state,
  width,
  height,
  anomalyBurstRegions,
  selectedDeckMarker,
  waveformAnomalies,
  trackWaveProgress,
}: DrawMonitorDeckCanvasLayersInput): void {
  const scene = buildMonitorDeckCanvasScenePlan({ state, width, height });
  drawMonitorDeckBackgroundLane(context, state, scene);
  drawMonitorDeckTrackLane(context, state, width, scene);
  drawMonitorDeckLogLane(context, state, width, scene);
  drawMonitorDeckOverlayLane({
    context,
    state,
    anomalyBurstRegions,
    selectedDeckMarker,
    waveformAnomalies,
    trackWaveProgress,
    scene,
  });
}
