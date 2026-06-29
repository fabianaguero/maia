import type { MutableRefObject } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { StartSessionInput } from "../../types/monitor";
import {
  bootstrapLiveMonitorSessionState,
  resetMonitorSessionState,
} from "./monitorOrchestrationRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";

export interface MonitorLiveLifecycleLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn?: (message: string, ...args: unknown[]) => void;
}

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
  ensureAudioContext: () => Promise<AudioContext>;
  emitProbe?: ((context: AudioContext) => void) | null;
  reloadPendingGuideTrack: () => void;
  doPoll: () => void;
  logger?: MonitorLiveLifecycleLogger;
  logLabel?: string;
}): Promise<void> {
  bootstrapLiveMonitorSessionState({
    session: input.session,
    sourceTemplateId: input.sourceTemplateId ?? null,
    persistedSessionId: input.persistedSessionId,
    startFromBeginning: input.startFromBeginning,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
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
    ensureAudioContext: input.ensureAudioContext,
    emitProbe: input.emitProbe,
    reloadPendingGuideTrack: input.reloadPendingGuideTrack,
    doPoll: input.doPoll,
    logger: input.logger,
    logLabel: input.logLabel,
  });
}

export async function finalizeLiveMonitorStartupState(input: {
  ensureAudioContext: () => Promise<AudioContext>;
  emitProbe?: ((context: AudioContext) => void) | null;
  reloadPendingGuideTrack: () => void;
  doPoll: () => void;
  logger?: MonitorLiveLifecycleLogger;
  logLabel?: string;
}): Promise<void> {
  const currentCtx = await input.ensureAudioContext();
  if (input.logger && input.logLabel) {
    input.logger.info(
      `[MAIA:Audio] ${input.logLabel} ctx state=${currentCtx.state} sampleRate=${currentCtx.sampleRate}`,
    );
  }

  if (currentCtx.state === "running" && input.emitProbe) {
    input.emitProbe(currentCtx);
    if (input.logger && input.logLabel) {
      input.logger.info("[MAIA:Audio] start-tone fired");
    }
  }

  input.reloadPendingGuideTrack();
  input.doPoll();
}

export function clearMonitorAudioState(input: {
  stopAllMonitorAudio: () => void;
  currentSegmentRef: MutableRefObject<unknown | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
}): void {
  input.stopAllMonitorAudio();
  input.currentSegmentRef.current = null;
  if (input.audioContextRef.current?.state === "running") {
    void input.audioContextRef.current.suspend();
  }
}

export function resolveStoppedMonitorSessionEffects(input: {
  session: ActiveMonitorSession | null;
  wasPlayback: boolean;
}): {
  persistedSessionIdToPause: string | null;
  shouldStopNativeSession: boolean;
  nativeSessionId: string | null;
} {
  if (input.wasPlayback) {
    return {
      persistedSessionIdToPause: null,
      shouldStopNativeSession: false,
      nativeSessionId: null,
    };
  }

  const current = input.session;
  return {
    persistedSessionIdToPause: current?.persistedSessionId ?? null,
    shouldStopNativeSession:
      current?.pollMode === "session" ||
      current?.pollMode === "websocket" ||
      current?.pollMode === "http-poll",
    nativeSessionId: current?.sessionId ?? null,
  };
}

export async function stopLiveMonitorSessionState(input: {
  session: ActiveMonitorSession | null;
  wasPlayback: boolean;
  stopAllMonitorAudio: () => void;
  currentSegmentRef: MutableRefObject<unknown | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  stopPolling: () => void;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
  updatePersistedSessionStatus: (
    id: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void> | void;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
}): Promise<void> {
  clearMonitorAudioState({
    stopAllMonitorAudio: input.stopAllMonitorAudio,
    currentSegmentRef: input.currentSegmentRef,
    audioContextRef: input.audioContextRef,
  });

  input.stopPolling();
  resetMonitorSessionState({
    sessionRef: input.sessionRef,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
  });

  const stopEffects = resolveStoppedMonitorSessionEffects({
    session: input.session,
    wasPlayback: input.wasPlayback,
  });

  if (stopEffects.persistedSessionIdToPause) {
    void input.updatePersistedSessionStatus(stopEffects.persistedSessionIdToPause, "paused");
  }

  if (stopEffects.shouldStopNativeSession && stopEffects.nativeSessionId) {
    try {
      await input.stopStreamSession(stopEffects.nativeSessionId);
    } catch {
      // best-effort
    }
  }
}

export async function resumeMonitorAudioContextState(input: {
  ensureAudioContext: () => Promise<AudioContext | null>;
  emitProbe: (context: AudioContext) => void;
  logger?: MonitorLiveLifecycleLogger;
}): Promise<AudioContext | null> {
  const activeCtx = await input.ensureAudioContext();
  if (activeCtx && activeCtx.state === "running") {
    input.logger?.info?.(
      `[MAIA:Audio] context running — sampleRate=${activeCtx.sampleRate} state=${activeCtx.state}`,
    );
    input.emitProbe(activeCtx);
    return activeCtx;
  }

  input.logger?.warn?.(
    `[MAIA:Audio] context NOT running after resume — state=${activeCtx?.state ?? "null"}`,
  );
  return activeCtx;
}
