import type { MonitorLogLine } from "./monitorLogParsing";
import { buildMonitorTailSyncPlan, shouldPinMonitorTail } from "./simpleMonitorInteractionRuntime";

export function buildSimpleMonitorLiveTailEffectState(input: {
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  shouldFocusSelectedLog: boolean;
  isTailPinned: boolean;
}) {
  return buildMonitorTailSyncPlan(input);
}

export function buildSimpleMonitorLiveTailScrollState(input: {
  distanceFromBottom: number;
}) {
  return {
    isTailPinned: shouldPinMonitorTail(input.distanceFromBottom),
  };
}

export function buildSimpleMonitorLiveTailFocusState(anomalyId: string) {
  return {
    shouldFocusSelectedLog: true,
    anomalyId,
  };
}
