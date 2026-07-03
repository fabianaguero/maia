import { withAlpha } from "./monitorDeckCanvasPalette";
import { fillRect, fillVerticalGradientRect } from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckBackgroundLane(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  const { palette } = state;
  fillVerticalGradientRect(
    context,
    { x: 0, y: 0, width: state.size.width, height: state.size.height },
    scene.background.fillStops,
  );

  context.fillStyle = state.palette.separatorLine;
  fillRect(context, scene.background.headerSeparator);
  fillRect(context, scene.background.laneSeparator);

  context.fillStyle = state.palette.centerLine;
  fillRect(context, scene.background.centerBand);

  context.fillStyle = withAlpha(palette.playheadCore, 0.08);
  fillRect(context, scene.background.playheadColumn);
}
