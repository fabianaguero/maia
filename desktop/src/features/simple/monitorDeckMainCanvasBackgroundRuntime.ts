import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { MonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneTypes";

export function buildMonitorDeckCanvasBackgroundPlan(input: {
  state: MonitorDeckMainCanvasState;
  width: number;
  height: number;
}): MonitorDeckCanvasScenePlan["background"] {
  const { state, width, height } = input;
  const { palette, layout } = state;
  const { headerInset, footerInset, separatorY, logBaseY, centerBandHeight } = layout;

  return {
    fillStops: [
      { offset: 0, color: palette.backgroundTop },
      { offset: 0.45, color: palette.backgroundMid },
      { offset: 1, color: palette.backgroundBottom },
    ],
    headerSeparator: { x: 0, y: headerInset - 1, width, height: 1 },
    laneSeparator: { x: 0, y: separatorY, width, height: 1 },
    centerBand: {
      x: 0,
      y: logBaseY - centerBandHeight / 2,
      width,
      height: centerBandHeight,
    },
    playheadColumn: {
      x: width * 0.5 - 1,
      y: headerInset,
      width: 2,
      height: height - headerInset - footerInset,
    },
  };
}
