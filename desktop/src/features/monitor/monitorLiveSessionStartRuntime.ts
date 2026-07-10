import type { MutableRefObject } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import { bootstrapLiveMonitorSessionState } from "./monitorOrchestrationRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import {
  finalizeLiveMonitorStartupState,
  type MonitorLiveLifecycleLogger,
} from "./monitorLiveAudioLifecycleRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SetSourceTemplateState = (value: SourceTemplate) => void;
type ResetReplayTelemetryFn = () => void;

export async function resolveLiveMonitorPollMode(input: {
  sessionInput: StartSessionInput;
  startStreamSession: (input: StartSessionInput) => Promise<unknown>;
}): Promise<ActiveMonitorSession["pollMode"]> {
  try {
    await input.startStreamSession(input.sessionInput);
    return "session";
  } catch {
    return "direct";
  }
}

export async function startLiveMonitorSessionState(input: {
  session: ActiveMonitorSession;
  initialStreamUpdate?: LiveLogStreamUpdate | null;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
  startFromBeginning?: boolean;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  recentUpdatesRef: MutableRefObject<LiveLogStreamUpdate[]>;
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
  ensureAudioContext: () => Promise<AudioContext>;
  emitProbe?: ((context: AudioContext) => void) | null;
  reloadPendingGuideTrack: () => void;
  doPoll: () => void;
  logger?: MonitorLiveLifecycleLogger;
  logLabel?: string;
}): Promise<void> {
  bootstrapLiveMonitorSessionState({
    session: input.session,
    initialStreamUpdate: input.initialStreamUpdate ?? null,
    sourceTemplateId: input.sourceTemplateId ?? null,
    persistedSessionId: input.persistedSessionId,
    startFromBeginning: input.startFromBeginning,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
    recentUpdatesRef: input.recentUpdatesRef,
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
  });

  await finalizeLiveMonitorStartupState({
    initialStreamUpdate: input.initialStreamUpdate ?? null,
    recentUpdatesRef: input.recentUpdatesRef,
    ensureAudioContext: input.ensureAudioContext,
    emitProbe: input.emitProbe,
    reloadPendingGuideTrack: input.reloadPendingGuideTrack,
    doPoll: input.doPoll,
    logger: input.logger,
    logLabel: input.logLabel,
  });
}
