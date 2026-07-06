import type { MutableRefObject } from "react";

import type { MonitorMetrics, ActiveMonitorSession } from "./monitorContextTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";
import type { MonitorOrchestrationLogger } from "./monitorOrchestrationRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type ResetReplayTelemetryFn = () => void;

export function resetMonitorSessionState(input: {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
}): void {
  input.sessionRef.current = null;
  input.directCursorRef.current = undefined;
  input.emptyWindowsRef.current = 0;
  input.activeRef.current = false;
  input.setSession(null);
  input.setIsPlayback(false);
  input.isPlaybackRef.current = false;
  input.resetReplayTelemetry();
  input.setMetrics(createEmptyMonitorMetrics());
}

export async function replaceExistingMonitorSession(input: {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  stopPolling: () => void;
  setSession: SetSessionState;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
  logger?: MonitorOrchestrationLogger;
}): Promise<string | null> {
  const current = input.sessionRef.current;
  if (!current) {
    return null;
  }

  input.stopPolling();
  input.sessionRef.current = null;
  input.setSession(null);

  try {
    await input.stopStreamSession(current.sessionId);
  } catch {
    // best-effort cleanup
  }

  return current.sessionId;
}
