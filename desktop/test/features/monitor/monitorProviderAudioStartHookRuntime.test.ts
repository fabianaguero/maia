import { describe, expect, it, vi } from "vitest";

import { buildMonitorProviderLiveStartHookInput } from "../../../src/features/monitor/monitorProviderAudioStartHookRuntime";

function createSource() {
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
      setMetrics: vi.fn(),
    },
    audio: {
      audioContextRef: { current: null },
      setAudioContext: vi.fn(),
      guideTrackRef: { current: null },
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
    },
    playback: {
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
      setPlaybackProgress: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setPlaybackEventIndex: vi.fn(),
      setPlaybackEventCount: vi.fn(),
    },
    live: {
      activeRef: { current: true },
      pollTimerRef: { current: null as number | null },
      wsRef: { current: null as WebSocket | null },
      wsLineBufferRef: { current: [] as string[] },
      httpUrlRef: { current: "" },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollIndexRef: { current: 0 },
      isPlaybackRef: { current: false },
      listenersRef: { current: new Set() },
    },
    template: {
      activeTemplateRef: { current: { id: "default" } as never },
      setActiveTemplateState: vi.fn(),
      buildReloadPendingGuideTrack: vi.fn((reason: string) => vi.fn(() => reason)),
    },
    transport: {
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
    },
    persistence: {
      updatePersistedSessionCursor: vi.fn(async () => undefined),
      insertSessionEvent: vi.fn(async () => undefined),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
    },
  } as never;
}

describe("monitorProviderAudioStartHookRuntime", () => {
  it("builds live-start input with probe when requested", () => {
    const source = createSource();
    const deps = {
      resetReplayTelemetry: vi.fn(),
      doPoll: vi.fn(async () => undefined),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
    };
    const emitProbe = vi.fn();
    const runProviderPoll = vi.fn();

    expect(
      buildMonitorProviderLiveStartHookInput({
        live: source.live,
        persistence: source.persistence,
        session: source.session,
        template: source.template,
        deps,
        reason: "session-start",
        includeProbe: true,
        emitProbe,
        runProviderPoll,
      }),
    ).toEqual(
      expect.objectContaining({
        directCursorRef: source.live.directCursorRef,
        emptyWindowsRef: source.live.emptyWindowsRef,
        activeTemplateRef: source.template.activeTemplateRef,
        updatePersistedSessionStatus: source.persistence.updatePersistedSessionStatus,
        resetReplayTelemetry: deps.resetReplayTelemetry,
        ensureAudioContext: deps.ensureProviderAudioContext,
        emitProbe,
        doPoll: runProviderPoll,
        reloadPendingGuideTrack: expect.any(Function),
      }),
    );
    expect(source.template.buildReloadPendingGuideTrack).toHaveBeenCalledWith("session-start");
  });

  it("omits the live-start probe when disabled", () => {
    const source = createSource();
    const deps = {
      resetReplayTelemetry: vi.fn(),
      doPoll: vi.fn(async () => undefined),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
    };

    expect(
      buildMonitorProviderLiveStartHookInput({
        live: source.live,
        persistence: source.persistence,
        session: source.session,
        template: source.template,
        deps,
        reason: "attach-session",
        includeProbe: false,
        emitProbe: vi.fn(),
        runProviderPoll: vi.fn(),
      }).emitProbe,
    ).toBeUndefined();
  });
});
