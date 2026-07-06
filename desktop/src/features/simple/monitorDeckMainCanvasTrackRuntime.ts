import { withAlpha } from "./monitorDeckCanvasPalette";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { MonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneTypes";

export function buildMonitorDeckCanvasTrackPlan(input: {
  state: MonitorDeckMainCanvasState;
  width: number;
}): MonitorDeckCanvasScenePlan["track"] {
  const { state, width } = input;
  const { palette, layout } = state;
  const { headerInset, deckHeight, trackBaseY, trackAmplitude } = layout;

  return {
    glowRect: {
      x: 0,
      y: trackBaseY - trackAmplitude - 10,
      width,
      height: trackAmplitude + 20,
    },
    glowStops: [
      { offset: 0, color: withAlpha(palette.trackGlow, 0) },
      { offset: 0.5, color: palette.trackGlow },
      { offset: 1, color: withAlpha(palette.trackGlow, 0.04) },
    ],
    energyBandTopY: headerInset + deckHeight * 0.08,
    energyBandHeight: Math.max(10, deckHeight * 0.1),
    phraseRibbonTopY: headerInset + deckHeight * 0.31,
    phraseRibbonHeight: Math.max(12, deckHeight * 0.12),
    fillStops: [
      { offset: 0, color: palette.trackTopCool },
      { offset: 0.14, color: withAlpha(palette.trackTopCool, 0.9) },
      { offset: 0.52, color: withAlpha(palette.trackBottomCool, 0.84) },
      { offset: 1, color: withAlpha(palette.trackBottomCool, 0.68) },
    ],
    glossStops: [
      { offset: 0, color: withAlpha(palette.playheadCore, 0.28) },
      { offset: 0.4, color: withAlpha(palette.playheadCore, 0.06) },
      { offset: 1, color: withAlpha(palette.playheadCore, 0.04) },
    ],
    glossAmplitudeScale: 0.9,
  };
}
