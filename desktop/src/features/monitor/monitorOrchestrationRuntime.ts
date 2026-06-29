import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { MonitorMetrics, ActiveMonitorSession } from "./monitorContextTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";
import { applyMonitorSourceTemplateState } from "./monitorStartupRuntime";

export interface MonitorOrchestrationLogger {
  info: (message: string, ...args: unknown[]) => void;
}

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SetSourceTemplateState = (value: SourceTemplate) => void;
type ResetReplayTelemetryFn = () => void;
type SyncReplayTelemetryFn = (processedEvents: number) => void;

export function resetLivePollingState(input: {
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  startFromBeginning?: boolean;
}): void {
  input.directCursorRef.current = input.startFromBeginning ? 0 : undefined;
  input.emptyWindowsRef.current = 0;
  input.pollIndexRef.current = 0;
}

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

export function activatePlaybackMonitorSessionState(input: {
  session: ActiveMonitorSession;
  events: SessionEvent[];
  cumulativeMetrics: MonitorMetrics[];
  shouldHydrateReplay: boolean;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
}): number {
  input.sessionRef.current = input.session;
  input.setSession(input.session);
  input.setIsPlayback(true);
  input.isPlaybackRef.current = true;
  input.playbackPausedRef.current = false;
  input.setIsPlaybackPaused(false);
  input.replayEventsRef.current = input.events;
  input.replayMetricsRef.current = input.cumulativeMetrics;
  input.replayIndexRef.current = 0;
  const hydrationToken = input.replayHydrationTokenRef.current + 1;
  input.replayHydrationTokenRef.current = hydrationToken;
  input.replayHydratingRef.current = input.shouldHydrateReplay;
  input.syncReplayTelemetry(0);
  input.setMetrics(createEmptyMonitorMetrics());
  input.activeRef.current = true;
  return hydrationToken;
}

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
