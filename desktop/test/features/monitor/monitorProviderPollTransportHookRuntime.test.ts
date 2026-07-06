import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderEmitUpdateHookInput,
  buildMonitorProviderPollTransportHookInput,
} from "../../../src/features/monitor/monitorProviderPollTransportHookRuntime";

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

describe("monitorProviderPollTransportHookRuntime", () => {
  it("builds update emission input from provider runtime state", () => {
    const source = createSource();
    const update = { summary: "window", toOffset: 64, lineCount: 2 } as never;

    expect(
      buildMonitorProviderEmitUpdateHookInput({
        audio: source.audio,
        live: source.live,
        logger: source.logger,
        persistence: source.persistence,
        session: source.session,
        update,
        options: { accumulateMetrics: true },
      }),
    ).toEqual(
      expect.objectContaining({
        update,
        listenersRef: source.live.listenersRef,
        sessionRef: source.session.sessionRef,
        pollIndexRef: source.live.pollIndexRef,
        audioContextRef: source.audio.audioContextRef,
        setMetrics: source.session.setMetrics,
        logger: source.logger,
        options: { accumulateMetrics: true },
      }),
    );
  });

  it("builds poll execution input from provider runtime state", () => {
    const source = createSource();
    const emitUpdate = vi.fn();
    const schedulePoll = vi.fn();
    const doPoll = vi.fn(async () => undefined);

    expect(
      buildMonitorProviderPollTransportHookInput({
        live: source.live,
        logger: source.logger,
        session: source.session,
        transport: source.transport,
        emitUpdate,
        schedulePoll,
        doPoll,
      }),
    ).toEqual(
      expect.objectContaining({
        sessionRef: source.session.sessionRef,
        activeRef: source.live.activeRef,
        directCursorRef: source.live.directCursorRef,
        pollStreamSession: source.transport.pollStreamSession,
        pollLogStream: source.transport.pollLogStream,
        ingestStreamChunk: source.transport.ingestStreamChunk,
        fetchText: source.transport.fetchText,
        emitUpdate,
        schedulePoll,
        doPoll,
        logger: source.logger,
      }),
    );
  });
});
