import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import {
  buildMonitorProviderLiveStartBaseInput,
  buildMonitorProviderLiveStartState,
  replaceExistingMonitorSessionIfPresent,
} from "../../../src/features/monitor/monitorProviderStartRuntime";

vi.mock("../../../src/features/monitor/monitorOrchestrationRuntime", () => ({
  replaceExistingMonitorSession: vi.fn(async () => undefined),
}));

function createSession(): ActiveMonitorSession {
  return {
    sessionId: "session-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "Repo",
    sourcePath: "/logs/app.log",
    adapterKind: "file",
    pollMode: "session",
    startedAt: 1,
  };
}

describe("monitorProviderStartRuntime", () => {
  it("replaces an existing monitor session only when one is active", async () => {
    const orchestration = await import("../../../src/features/monitor/monitorOrchestrationRuntime");
    const replaceExistingMonitorSession = vi.mocked(orchestration.replaceExistingMonitorSession);
    replaceExistingMonitorSession.mockClear();

    await replaceExistingMonitorSessionIfPresent({
      sessionRef: { current: null },
      stopPolling: vi.fn(),
      setSession: vi.fn(),
      stopStreamSession: vi.fn(async () => undefined),
    });

    expect(replaceExistingMonitorSession).not.toHaveBeenCalled();

    const session = createSession();
    const stopPolling = vi.fn();
    const setSession = vi.fn();
    const stopStreamSession = vi.fn(async () => undefined);

    await replaceExistingMonitorSessionIfPresent({
      sessionRef: { current: session },
      stopPolling,
      setSession,
      stopStreamSession,
    });

    expect(replaceExistingMonitorSession).toHaveBeenCalledWith({
      sessionRef: { current: session },
      stopPolling,
      setSession,
      stopStreamSession,
    });
  });

  it("builds the shared live-start state snapshot for provider actions", async () => {
    const session = createSession();
    const activeTemplateRef = { current: resolveSourceTemplate("melodic-techno") };
    const state = buildMonitorProviderLiveStartState({
      session,
      sourceTemplateId: "melodic-techno",
      persistedSessionId: "persisted-1",
      startFromBeginning: true,
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      pollIndexRef: { current: 0 },
      activeTemplateRef,
      setActiveTemplateState: vi.fn(),
      updatePersistedSessionStatus: vi.fn(),
      sessionRef: { current: session },
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setMetrics: vi.fn(),
      resetReplayTelemetry: vi.fn(),
      ensureAudioContext: vi.fn(
        async () => ({ sampleRate: 44100, state: "running" }) as AudioContext,
      ),
      emitProbe: vi.fn(),
      reloadPendingGuideTrack: vi.fn(),
      doPoll: vi.fn(),
      logger: { info: vi.fn() },
      logLabel: "startSession",
    });

    expect(state.session).toBe(session);
    expect(state.sourceTemplateId).toBe("melodic-techno");
    expect(state.startFromBeginning).toBe(true);
    expect(state.activeTemplateRef).toBe(activeTemplateRef);
    expect(state.logLabel).toBe("startSession");
  });

  it("builds the reusable provider live-start base input", () => {
    const session = createSession();
    const activeTemplateRef = { current: resolveSourceTemplate("melodic-techno") };
    const baseInput = buildMonitorProviderLiveStartBaseInput({
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      pollIndexRef: { current: 0 },
      activeTemplateRef,
      setActiveTemplateState: vi.fn(),
      updatePersistedSessionStatus: vi.fn(),
      sessionRef: { current: session },
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setMetrics: vi.fn(),
      resetReplayTelemetry: vi.fn(),
      ensureAudioContext: vi.fn(
        async () => ({ sampleRate: 44100, state: "running" }) as AudioContext,
      ),
      emitProbe: vi.fn(),
      reloadPendingGuideTrack: vi.fn(),
      doPoll: vi.fn(),
      logger: { info: vi.fn() },
    });

    expect(baseInput.activeTemplateRef).toBe(activeTemplateRef);
    expect(baseInput.sessionRef.current).toBe(session);
    expect(typeof baseInput.ensureAudioContext).toBe("function");
    expect(typeof baseInput.reloadPendingGuideTrack).toBe("function");
  });
});
