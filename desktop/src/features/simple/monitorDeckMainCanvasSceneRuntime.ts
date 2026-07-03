import { buildMonitorDeckCanvasBackgroundPlan } from "./monitorDeckMainCanvasBackgroundRuntime";
import { buildMonitorDeckCanvasLogPlan } from "./monitorDeckMainCanvasLogRuntime";
import { buildMonitorDeckCanvasOverlayPlan } from "./monitorDeckMainCanvasOverlayRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import { buildMonitorDeckCanvasTrackPlan } from "./monitorDeckMainCanvasTrackRuntime";
import type { MonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneTypes";

export function buildMonitorDeckCanvasScenePlan(input: {
  state: MonitorDeckMainCanvasState;
  width: number;
  height: number;
}): MonitorDeckCanvasScenePlan {
  return {
    background: buildMonitorDeckCanvasBackgroundPlan(input),
    track: buildMonitorDeckCanvasTrackPlan(input),
    log: buildMonitorDeckCanvasLogPlan(input),
    overlay: buildMonitorDeckCanvasOverlayPlan(input),
  };
}
export { buildMonitorDeckLogContourPoints } from "./monitorDeckMainCanvasLogRuntime";
export type { MonitorDeckCanvasScenePlan, MonitorDeckGradientStop, MonitorDeckRect } from "./monitorDeckMainCanvasSceneTypes";
