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

export interface MonitorDeckMainCanvasState {
  palette: ReturnType<typeof resolveMonitorDeckPalette>;
  size: ReturnType<typeof resolveMonitorDeckCanvasSize>;
  layout: ReturnType<typeof buildMonitorDeckLayout>;
  logSamples: number[];
  trackWaveSamples: number[];
  logWaveOverlay: LogWaveOverlayPoint[];
}

export function buildMonitorDeckMainCanvasState(
  input: BuildMonitorDeckMainCanvasStateInput,
): MonitorDeckMainCanvasState {
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
  const logSamples = input.logWaveOverlay.map((point) => {
    const activity = Math.max(0, Math.min(1, (point.level - 0.1) / 0.9));
    return Math.min(1, 0.035 + Math.pow(activity, 0.72) * 0.78 + point.heat * 0.22);
  });

  return {
    palette,
    size,
    layout,
    logSamples,
    trackWaveSamples: input.trackWaveSamples,
    logWaveOverlay: input.logWaveOverlay,
  };
}
