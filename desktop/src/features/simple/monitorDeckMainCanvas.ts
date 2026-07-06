import type {
  DeckSelectedMarker,
  LogWaveOverlayPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckViewModel";
import type { MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";
import { drawMonitorDeckCanvasLayers, sizeMonitorDeckCanvas } from "./monitorDeckMainCanvasLayers";
import { buildMonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";

export function renderMonitorDeckCanvas({
  canvas,
  stage,
  trackWaveSamples,
  logWaveOverlay,
  anomalyBurstRegions,
  selectedDeckMarker,
  waveformAnomalies,
  trackWaveProgress,
  visualPreset = "balanced",
}: {
  canvas: HTMLCanvasElement;
  stage: HTMLDivElement;
  trackWaveSamples: number[];
  logWaveOverlay: LogWaveOverlayPoint[];
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  selectedDeckMarker: DeckSelectedMarker | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  visualPreset?: MonitorDeckVisualPreset;
}): void {
  const state = buildMonitorDeckMainCanvasState({
    stageWidth: stage.clientWidth,
    stageHeight: stage.clientHeight,
    devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    visualPreset,
    trackWaveSamples,
    logWaveOverlay,
  });
  const { size } = state;
  const { width, height, dpr } = size;
  sizeMonitorDeckCanvas(canvas, size);

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  drawMonitorDeckCanvasLayers({
    context,
    state,
    width,
    height,
    anomalyBurstRegions,
    selectedDeckMarker,
    waveformAnomalies,
    trackWaveProgress,
  });
}
