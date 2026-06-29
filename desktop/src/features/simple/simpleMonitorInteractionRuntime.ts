import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLaunchSource } from "./monitorSourceOptions";

export const DEFAULT_MONITOR_TAIL_PIN_THRESHOLD_PX = 8;

export interface SimpleMonitorStartRequest {
  selectedSourceOption: MonitorLaunchSource | null;
  selectedSoundId: string;
  canStartSelectedSource: boolean;
  setLaunchingImmediate: () => void;
  waitForNextFrame: () => Promise<void>;
  resumeAudio: () => Promise<void> | void;
  startMonitoring: (source: MonitorLaunchSource, trackId?: string) => Promise<void> | void;
  resetLaunchingOnFailure: () => void;
}

export type MonitorTailSyncPlan =
  | { type: "focus"; lineId: string }
  | { type: "wait-focus" }
  | { type: "pin" }
  | { type: "none" };

export function shouldPinMonitorTail(
  distanceFromBottom: number,
  thresholdPx = DEFAULT_MONITOR_TAIL_PIN_THRESHOLD_PX,
): boolean {
  return distanceFromBottom <= thresholdPx;
}

export function buildMonitorTailSyncPlan(input: {
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  shouldFocusSelectedLog: boolean;
  isTailPinned: boolean;
}): MonitorTailSyncPlan {
  if (input.shouldFocusSelectedLog && input.selectedAnomalyId) {
    const line = input.liveLines.find((entry) => entry.anomalyId === input.selectedAnomalyId);
    if (line) {
      return { type: "focus", lineId: line.id };
    }
    return { type: "wait-focus" };
  }

  if (input.isTailPinned) {
    return { type: "pin" };
  }

  return { type: "none" };
}

export function canStartSimpleMonitorRequest(input: {
  selectedSourceOption: MonitorLaunchSource | null;
  selectedSoundId: string;
  canStartSelectedSource: boolean;
}): boolean {
  return Boolean(
    input.selectedSourceOption && input.selectedSoundId && input.canStartSelectedSource,
  );
}

export async function executeSimpleMonitorStartRequest(
  input: SimpleMonitorStartRequest,
): Promise<boolean> {
  if (!canStartSimpleMonitorRequest(input)) {
    return false;
  }

  try {
    input.setLaunchingImmediate();
    await input.waitForNextFrame();
    await input.resumeAudio();
    await input.startMonitoring(
      input.selectedSourceOption as MonitorLaunchSource,
      input.selectedSoundId,
    );
    return true;
  } catch {
    input.resetLaunchingOnFailure();
    return false;
  }
}
