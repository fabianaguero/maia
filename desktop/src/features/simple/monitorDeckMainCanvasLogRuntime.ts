import { withAlpha } from "./monitorDeckCanvasPalette";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { MonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneTypes";

export function buildMonitorDeckLogContourPoints(input: {
  samples: number[];
  width: number;
  baseY: number;
  amplitude: number;
}): Array<{ x: number; y: number }> {
  const { samples, width, baseY, amplitude } = input;
  return samples.map((value, index) => ({
    x: (index / Math.max(1, samples.length - 1)) * width,
    y: baseY - value * amplitude,
  }));
}

export function buildMonitorDeckCanvasLogPlan(input: {
  state: MonitorDeckMainCanvasState;
  width: number;
}): MonitorDeckCanvasScenePlan["log"] {
  const { state, width } = input;
  const { palette, layout, logSamples } = state;
  const { logBaseY, logAmplitude } = layout;

  return {
    glowRect: {
      x: 0,
      y: logBaseY - logAmplitude - 12,
      width,
      height: logAmplitude + 22,
    },
    glowStops: [
      { offset: 0, color: palette.logGlowTop },
      { offset: 0.5, color: palette.logGlowMid },
      { offset: 1, color: palette.logGlowBottom },
    ],
    bedRect: {
      x: 0,
      y: logBaseY - logAmplitude,
      width,
      height: logAmplitude + 4,
    },
    bedStops: [
      { offset: 0, color: withAlpha(palette.logWarm, 0.03) },
      { offset: 0.52, color: withAlpha(palette.logWarm, 0.06) },
      { offset: 1, color: withAlpha(palette.logCool, 0.12) },
    ],
    waveformStops: [
      { offset: 0, color: withAlpha(palette.logWarm, 0.68) },
      { offset: 0.48, color: withAlpha(palette.logCool, 0.52) },
      { offset: 1, color: withAlpha(palette.logCool, 0.2) },
    ],
    waveformAmplitudeScale: 0.92,
    quantizedBlockAmplitudeScale: 0.96,
    contourPoints: buildMonitorDeckLogContourPoints({
      samples: logSamples,
      width,
      baseY: logBaseY,
      amplitude: logAmplitude * 0.92,
    }),
    contourStops: [
      { offset: 0, color: withAlpha(palette.contourStroke, 0.88) },
      { offset: 1, color: withAlpha(palette.logWarm, 0.28) },
    ],
  };
}
