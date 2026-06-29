import type { LogWaveOverlayPoint } from "./monitorDeckViewModel";
import {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
  type MonitorDeckVisualPreset,
} from "./monitorDeckCanvasPalette";
import { buildMonitorDeckLayout, resolveMonitorDeckCanvasSize } from "./monitorDeckCanvasRuntime";

export interface BuildMonitorDeckMainCanvasStateInput {
  stageWidth: number;
  stageHeight: number;
  devicePixelRatio: number;
  visualPreset?: MonitorDeckVisualPreset;
  trackWaveSamples: number[];
  logWaveOverlay: LogWaveOverlayPoint[];
}

export function buildMonitorDeckMainCanvasState(input: BuildMonitorDeckMainCanvasStateInput) {
  const palette = resolveMonitorDeckPalette(
    input.visualPreset ?? "balanced",
    resolveCurrentMonitorDeckSkin(),
  );
  const size = resolveMonitorDeckCanvasSize({
    width: input.stageWidth,
    height: input.stageHeight,
    dpr: input.devicePixelRatio,
  });
  const layout = buildMonitorDeckLayout(size.width, size.height);
  const logSamples = input.logWaveOverlay.map((point) =>
    Math.max(0.04, point.level * (0.2 + point.heat * 0.45)),
  );

  return {
    palette,
    size,
    layout,
    logSamples,
    trackWaveSamples: input.trackWaveSamples,
    logWaveOverlay: input.logWaveOverlay,
  };
}
