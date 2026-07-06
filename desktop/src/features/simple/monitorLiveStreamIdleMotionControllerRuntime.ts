import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import { buildMonitorLiveStreamIdleState } from "./monitorLiveStreamOrchestrationRuntime";

export function buildMonitorLiveStreamIdleMotionTickState(input: {
  nowMs: number;
  lastStreamEventAtMs: number;
  idleHoldMs: number;
  controls: MonitorDeckControls;
  liveSuggestedBpm: number | null;
  trackBpm: number | null;
  previous: MonitorLogSignalPoint[];
}): MonitorLogSignalPoint[] | null {
  const idleForMs = input.nowMs - input.lastStreamEventAtMs;
  if (idleForMs < input.idleHoldMs) {
    return null;
  }

  return buildMonitorLiveStreamIdleState({
    previous: input.previous,
    nowMs: input.nowMs,
    idleForMs,
    idleHoldMs: input.idleHoldMs,
    idleMix: input.controls.idleMotion / 100,
    effectiveBpm: input.liveSuggestedBpm ?? input.trackBpm,
  });
}
