import type { MutableRefObject } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { MonitorMetrics, ActiveMonitorSession } from "./monitorContextTypes";
import { applyMonitorSourceTemplateState } from "./monitorStartupRuntime";
import { activateLiveMonitorSessionState } from "./monitorLiveSessionActivationRuntime";
import { resetLivePollingState } from "./monitorLiveSessionPollingResetRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SetSourceTemplateState = (value: SourceTemplate) => void;
type ResetReplayTelemetryFn = () => void;

export function bootstrapLiveMonitorSessionState(input: {
  session: ActiveMonitorSession;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
  startFromBeginning?: boolean;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: SetSourceTemplateState;
  updatePersistedSessionStatus: (
    id: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void> | void;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
}): void {
  resetLivePollingState({
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
    startFromBeginning: input.startFromBeginning,
  });

  applyMonitorSourceTemplateState({
    sourceTemplateId: input.sourceTemplateId ?? null,
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
  });

  if (input.persistedSessionId) {
    void input.updatePersistedSessionStatus(input.persistedSessionId, "active");
  }

  activateLiveMonitorSessionState({
    session: input.session,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
  });
}
