import { withAlpha } from "./monitorDeckCanvasPalette";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { MonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneTypes";

export function buildMonitorDeckCanvasOverlayPlan(input: {
  state: MonitorDeckMainCanvasState;
  width: number;
  height: number;
}): MonitorDeckCanvasScenePlan["overlay"] {
  const { state, width, height } = input;
  const { palette, layout } = state;
  const { headerInset, footerInset } = layout;

  return {
    playheadGlowRect: {
      x: width * 0.5 - 18,
      y: headerInset,
      width: 36,
      height: height - headerInset - footerInset,
    },
    playheadGlowStops: [
      { offset: 0, color: withAlpha(palette.playheadCore, 0) },
      { offset: 0.45, color: palette.playheadGlow },
      { offset: 0.5, color: palette.playheadCore },
      { offset: 0.55, color: palette.playheadGlow },
      { offset: 1, color: withAlpha(palette.playheadCore, 0) },
    ],
  };
}
