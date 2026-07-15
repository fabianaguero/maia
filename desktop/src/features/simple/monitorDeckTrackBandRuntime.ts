import { fillVerticalGradientRect } from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckTrackBand(
  context: CanvasRenderingContext2D,
  _state: MonitorDeckMainCanvasState,
  _width: number,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  fillVerticalGradientRect(context, scene.track.glowRect, scene.track.glowStops);
}
