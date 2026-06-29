import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import type { StartSessionInput } from "../../../src/types/monitor";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import {
  clearMonitorAudioState,
  finalizeLiveMonitorStartupState,
  resolveLiveMonitorPollMode,
  resolveStoppedMonitorSessionEffects,
  resumeMonitorAudioContextState,
  startLiveMonitorSessionState,
  stopLiveMonitorSessionState,
} from "../../../src/features/monitor/monitorLiveLifecycleRuntime";

function createSessionInput(): StartSessionInput {
  return {
    sessionId: "stream-1",
    source: "/logs/visits-service.log",
    adapterKind: "file",
    trackId: "track-1",
    trackTitle: "Daft Punk - Around The World",
    startFromBeginning: true,
  };
}

function createActiveSession(overrides: Partial<ActiveMonitorSession> = {}): ActiveMonitorSession {
  return {
    sessionId: "stream-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "visits-service",
    trackId: "track-1",
    trackName: "Daft Punk - Around The World",
    sourcePath: "/logs/visits-service.log",
    adapterKind: "file",
    pollMode: "session",
    startedAt: 123,
    ...overrides,
  };
}

describe("monitorLiveLifecycleRuntime", () => {
  it("resolves native session mode and browser fallback mode", async () => {
    await expect(
      resolveLiveMonitorPollMode({
        sessionInput: createSessionInput(),
        startStreamSession: vi.fn(async () => undefined),
      }),
    ).resolves.toBe("session");

    await expect(
      resolveLiveMonitorPollMode({
        sessionInput: createSessionInput(),
        startStreamSession: vi.fn(async () => {
          throw new Error("unsupported");
        }),
      }),
    ).resolves.toBe("direct");
  });

  it("finalizes live startup by resuming audio, probing, reloading guide tracks and polling", async () => {
    const context = {
      state: "running",
      sampleRate: 44100,
    } as AudioContext;
    const ensureAudioContext = vi.fn(async () => context);
    const emitProbe = vi.fn();
    const reloadPendingGuideTrack = vi.fn();
    const doPoll = vi.fn();
    const logger = { info: vi.fn() };

    await finalizeLiveMonitorStartupState({
      ensureAudioContext,
      emitProbe,
      reloadPendingGuideTrack,
      doPoll,
      logger,
      logLabel: "startSession",
    });

    expect(ensureAudioContext).toHaveBeenCalledTimes(1);
    expect(emitProbe).toHaveBeenCalledWith(context);
    expect(reloadPendingGuideTrack).toHaveBeenCalledTimes(1);
    expect(doPoll).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      "[MAIA:Audio] startSession ctx state=running sampleRate=44100",
    );
  });

  it("bootstraps and finalizes live monitor sessions in one step", async () => {
    const ensureAudioContext = vi.fn(
      async () =>
        ({
          state: "running",
          sampleRate: 48000,
        }) as AudioContext,
    );
    const emitProbe = vi.fn();
    const reloadPendingGuideTrack = vi.fn();
    const doPoll = vi.fn();
    const logger = { info: vi.fn() };
    const sessionRef = { current: null as ActiveMonitorSession | null };
    const activeRef = { current: false };
    const isPlaybackRef = { current: true };
    const directCursorRef = { current: undefined as number | undefined };
    const emptyWindowsRef = { current: 12 };
    const pollIndexRef = { current: 8 };
    const activeTemplateRef = { current: resolveSourceTemplate("deep-house") };
    const setActiveTemplateState = vi.fn();
    const updatePersistedSessionStatus = vi.fn();
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    const resetReplayTelemetry = vi.fn();

    await startLiveMonitorSessionState({
      session: createActiveSession(),
      sourceTemplateId: null,
      persistedSessionId: "persisted-1",
      startFromBeginning: true,
      directCursorRef,
      emptyWindowsRef,
      pollIndexRef,
      activeTemplateRef,
      setActiveTemplateState,
      updatePersistedSessionStatus,
      sessionRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
      ensureAudioContext,
      emitProbe,
      reloadPendingGuideTrack,
      doPoll,
      logger,
      logLabel: "attachSession",
    });

    expect(sessionRef.current?.sessionId).toBe("stream-1");
    expect(activeRef.current).toBe(true);
    expect(isPlaybackRef.current).toBe(false);
    expect(directCursorRef.current).toBe(0);
    expect(emptyWindowsRef.current).toBe(0);
    expect(pollIndexRef.current).toBe(0);
    expect(updatePersistedSessionStatus).toHaveBeenCalledWith("persisted-1", "active");
    expect(ensureAudioContext).toHaveBeenCalledTimes(1);
    expect(emitProbe).toHaveBeenCalledTimes(1);
    expect(reloadPendingGuideTrack).toHaveBeenCalledTimes(1);
    expect(doPoll).toHaveBeenCalledTimes(1);
  });

  it("clears monitor audio state and suspends active contexts", () => {
    const stopAllMonitorAudio = vi.fn();
    const suspend = vi.fn(async () => undefined);
    const currentSegmentRef = { current: { id: "segment" } };
    const audioContextRef = {
      current: {
        state: "running",
        suspend,
      } as unknown as AudioContext,
    };

    clearMonitorAudioState({
      stopAllMonitorAudio,
      currentSegmentRef,
      audioContextRef,
    });

    expect(stopAllMonitorAudio).toHaveBeenCalledTimes(1);
    expect(currentSegmentRef.current).toBeNull();
    expect(suspend).toHaveBeenCalledTimes(1);
  });

  it("stops live monitor sessions and pauses persisted/native transports", async () => {
    const stopAllMonitorAudio = vi.fn();
    const suspend = vi.fn(async () => undefined);
    const stopPolling = vi.fn();
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    const resetReplayTelemetry = vi.fn();
    const updatePersistedSessionStatus = vi.fn();
    const stopStreamSession = vi.fn(async () => undefined);
    const sessionRef = { current: createActiveSession() as ActiveMonitorSession | null };
    const directCursorRef = { current: 144 as number | undefined };
    const emptyWindowsRef = { current: 3 };
    const activeRef = { current: true };
    const isPlaybackRef = { current: false };

    await stopLiveMonitorSessionState({
      session: createActiveSession(),
      wasPlayback: false,
      stopAllMonitorAudio,
      currentSegmentRef: { current: { id: "segment" } },
      audioContextRef: {
        current: {
          state: "running",
          suspend,
        } as unknown as AudioContext,
      },
      stopPolling,
      sessionRef,
      directCursorRef,
      emptyWindowsRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
      updatePersistedSessionStatus,
      stopStreamSession,
    });

    expect(stopAllMonitorAudio).toHaveBeenCalledTimes(1);
    expect(stopPolling).toHaveBeenCalledTimes(1);
    expect(sessionRef.current).toBeNull();
    expect(directCursorRef.current).toBeUndefined();
    expect(emptyWindowsRef.current).toBe(0);
    expect(activeRef.current).toBe(false);
    expect(isPlaybackRef.current).toBe(false);
    expect(updatePersistedSessionStatus).toHaveBeenCalledWith("persisted-1", "paused");
    expect(stopStreamSession).toHaveBeenCalledWith("stream-1");
  });

  it("resumes monitor audio contexts and emits probes only when the context is running", async () => {
    const emitProbe = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };

    const runningCtx = {
      state: "running",
      sampleRate: 44100,
    } as AudioContext;

    await expect(
      resumeMonitorAudioContextState({
        ensureAudioContext: vi.fn(async () => runningCtx),
        emitProbe,
        logger,
      }),
    ).resolves.toBe(runningCtx);

    expect(emitProbe).toHaveBeenCalledWith(runningCtx);
    expect(logger.info).toHaveBeenCalled();

    emitProbe.mockClear();

    await resumeMonitorAudioContextState({
      ensureAudioContext: vi.fn(async () => null),
      emitProbe,
      logger,
    });

    expect(emitProbe).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("resolves persisted-status and native-session stop effects", () => {
    expect(
      resolveStoppedMonitorSessionEffects({
        session: createActiveSession(),
        wasPlayback: false,
      }),
    ).toEqual({
      persistedSessionIdToPause: "persisted-1",
      shouldStopNativeSession: true,
      nativeSessionId: "stream-1",
    });

    expect(
      resolveStoppedMonitorSessionEffects({
        session: createActiveSession({ pollMode: "direct", persistedSessionId: null }),
        wasPlayback: false,
      }),
    ).toEqual({
      persistedSessionIdToPause: null,
      shouldStopNativeSession: false,
      nativeSessionId: "stream-1",
    });

    expect(
      resolveStoppedMonitorSessionEffects({
        session: createActiveSession(),
        wasPlayback: true,
      }),
    ).toEqual({
      persistedSessionIdToPause: null,
      shouldStopNativeSession: false,
      nativeSessionId: null,
    });
  });
});
