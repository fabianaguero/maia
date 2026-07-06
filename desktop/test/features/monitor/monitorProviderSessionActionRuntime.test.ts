import { describe, expect, it, vi } from "vitest";

import {
  buildAttachMonitorProviderSessionActionInput,
  buildReplaceExistingMonitorProviderSessionInput,
  buildStartMonitorProviderSessionActionInput,
  buildStopMonitorProviderSessionInput,
} from "../../../src/features/monitor/monitorProviderSessionActionRuntime";

function createInput() {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    session: {
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setMetrics: vi.fn(),
      isPlayback: false,
    },
    live: {
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollTimerRef: { current: null as number | null },
    },
    audio: {
      currentSegmentRef: { current: null },
      audioContextRef: { current: null },
    },
    replay: {
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
    },
    guideTrack: {
      guideTrackPathRef: { current: null as string | null },
      guideTrackQueueRef: { current: [] as string[] },
      guideTrackRef: { current: null },
      guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    },
    runtime: {
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn((reason: string, includeProbe: boolean) => ({
        reason,
        includeProbe,
      })),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
    },
    api: {
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
      pollLogStream: vi.fn(),
    },
  };
}

describe("monitorProviderSessionActionRuntime", () => {
  it("builds replace/start/attach inputs from grouped dependencies", async () => {
    const input = createInput();
    const replaceExistingSessionIfPresent = vi.fn(async () => undefined);

    const replaceArgs = buildReplaceExistingMonitorProviderSessionInput(input);
    expect(replaceArgs).toEqual(
      expect.objectContaining({
        sessionRef: input.session.sessionRef,
        setSession: input.session.setSession,
        stopPolling: input.runtime.stopPolling,
        stopStreamSession: input.api.stopStreamSession,
      }),
    );

    const startArgs = buildStartMonitorProviderSessionActionInput({
      dependencies: {
        session: input.session,
        runtime: input.runtime,
        api: input.api,
        logger: input.logger,
      },
      repo: { id: "repo-1", title: "visits-service" } as never,
      sessionInput: {
        sessionId: "session-1",
        adapterKind: "file",
        source: "/logs/a.log",
      } as const,
      persistedSessionId: "persisted-1",
      replaceExistingSessionIfPresent,
    });

    expect(startArgs).toEqual(
      expect.objectContaining({
        persistedSessionId: "persisted-1",
        sessionRef: input.session.sessionRef,
        replaceExistingSessionIfPresent,
        startLiveMonitorSession: expect.any(Function),
        liveStartInput: { reason: "session-start", includeProbe: true },
        logger: input.logger,
      }),
    );

    const attachArgs = buildAttachMonitorProviderSessionActionInput({
      dependencies: {
        session: input.session,
        runtime: input.runtime,
        logger: input.logger,
      },
      sessionRecord: {
        sessionId: "attached-1",
        adapterKind: "file",
        source: "/logs/b.log",
      } as never,
      repoId: "repo-1",
      repoTitle: "visits-service",
      replaceExistingSessionIfPresent,
    });

    expect(attachArgs).toEqual(
      expect.objectContaining({
        sessionRef: input.session.sessionRef,
        replaceExistingSessionIfPresent,
        startLiveMonitorSession: expect.any(Function),
        liveStartInput: { reason: "attach-session", includeProbe: false },
        logger: input.logger,
      }),
    );
  });

  it("builds stop input with audio/live/runtime cleanup wiring", () => {
    const input = createInput();
    input.session.isPlayback = true;
    const currentSession = {
      sessionId: "session-1",
      sourcePath: "/logs/a.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: Date.now(),
      repoId: "repo-1",
      repoTitle: "visits-service",
    } as never;

    const stopArgs = buildStopMonitorProviderSessionInput({
      currentSession,
      session: input.session,
      audio: input.audio,
      live: input.live,
      runtime: input.runtime,
      api: input.api,
    });

    expect(stopArgs).toEqual(
      expect.objectContaining({
        session: currentSession,
        wasPlayback: true,
        currentSegmentRef: input.audio.currentSegmentRef,
        audioContextRef: input.audio.audioContextRef,
        stopPolling: input.runtime.stopPolling,
        sessionRef: input.session.sessionRef,
        directCursorRef: input.live.directCursorRef,
        resetReplayTelemetry: input.runtime.resetReplayTelemetry,
        updatePersistedSessionStatus: input.api.updatePersistedSessionStatus,
        stopStreamSession: input.api.stopStreamSession,
      }),
    );
    expect(typeof stopArgs.stopAllMonitorAudio).toBe("function");
  });
});
