import type { MutableRefObject } from "react";

import type { MonitorMetrics, ActiveMonitorSession } from "./monitorContextTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type ResetReplayTelemetryFn = () => void;

export function activateLiveMonitorSessionState(input: {
  session: ActiveMonitorSession;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
}): void {
  input.sessionRef.current = input.session;
  input.setSession(input.session);
  input.setIsPlayback(false);
  input.isPlaybackRef.current = false;
  input.resetReplayTelemetry();
  input.setMetrics(createEmptyMonitorMetrics());
  input.activeRef.current = true;
}
