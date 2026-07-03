import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";
import { advanceIdleLogSignalBuffer } from "./monitorLiveStreamSignalRuntime";

export function buildMonitorLiveStreamIdleState(input: {
  previous: MonitorLogSignalPoint[];
  nowMs: number;
  idleForMs: number;
  idleHoldMs: number;
  idleMix: number;
  effectiveBpm: number | null;
}): MonitorLogSignalPoint[] {
  if (input.idleForMs < input.idleHoldMs) {
    return input.previous;
  }

  return advanceIdleLogSignalBuffer({
    previous: input.previous,
    nowMs: input.nowMs,
    idleMix: input.idleMix,
    effectiveBpm: input.effectiveBpm,
  });
}
