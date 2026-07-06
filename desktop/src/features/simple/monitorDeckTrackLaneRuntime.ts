import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";
import { drawMonitorDeckTrackBand } from "./monitorDeckTrackBandRuntime";
import { drawMonitorDeckTrackWave } from "./monitorDeckTrackWaveRuntime";

export function drawMonitorDeckTrackLane(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  width: number,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  drawMonitorDeckTrackBand(context, state, width, scene);
  drawMonitorDeckTrackWave(context, state, width, scene);
}
