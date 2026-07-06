import { describe, expect, it, vi } from "vitest";

import {
  createActiveMonitorSession,
  createLiveMonitorSession,
  mapStreamPollResultToUpdate,
  runMonitorPollCycle,
  scheduleMonitorPoll,
  stopMonitorPollingState,
} from "../../../src/features/monitor/monitorSessionRuntime";
import type {
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
  StartSessionInput,
  StreamSessionPollResult,
  StreamSessionRecord,
} from "../../../src/types/monitor";
import type { RepositoryAnalysis } from "../../../src/types/library";

function createCue(overrides: Partial<LiveLogCue> = {}): LiveLogCue {
  return {
    id: "cue-1",
    eventIndex: 1,
    level: "warn",
    component: "queue",
    excerpt: "queue depth rising",
    noteHz: 440,
    durationMs: 120,
    gain: 0.5,
    waveform: "triangle",
    accent: "warn",
    ...overrides,
  };
}

function createMarker(overrides: Partial<LiveLogMarker> = {}): LiveLogMarker {
  return {
    eventIndex: 1,
    level: "error",
    component: "payments",
    excerpt: "HTTP 500",
    ...overrides,
  };
}

function createSessionRecord(overrides: Partial<StreamSessionRecord> = {}): StreamSessionRecord {
  return {
    sessionId: "stream-1",
    adapterKind: "file",
    source: "/logs/visits-service.log",
    label: "visits-service",
    createdAt: "2026-06-25T20:00:00.000Z",
    lastPolledAt: "2026-06-25T20:00:01.000Z",
    totalPolls: 1,
    fileCursor: 128,
    ...overrides,
  };
}

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: createSessionRecord(),
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.72,
    dominantLevel: "warn",
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1 },
    anomalyMarkers: [createMarker()],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [createCue()],
    parsedLines: ["WARN queue depth rising", "ERROR HTTP 500", "WARN retrying"],
    warnings: [],
    ...overrides,
  };
}

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-25T20:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.82,
    summary: "steady pulse",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [0.2, 0.3],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.72,
    dominantLevel: "warn",
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1 },
    anomalyMarkers: [createMarker()],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [createCue()],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

function createLogger() {
  return {
    trace: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };
}

describe("monitorSessionRuntime", () => {
  it("skips poll cycles when no session is active or polling is disabled", async () => {
    const logger = createLogger();
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();

    await runMonitorPollCycle({
      sessionRef: { current: null },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate,
      scheduleNext,
      logger,
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "inactive-1",
          repoId: "repo-1",
          repoTitle: "Inactive session",
          sourcePath: "/logs/inactive.log",
          adapterKind: "file",
          pollMode: "session",
        }),
      },
      activeRef: { current: false },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate,
      scheduleNext,
      logger,
    });

    expect(logger.trace).toHaveBeenCalledWith("doPoll skipped — no active session");
    expect(emitUpdate).not.toHaveBeenCalled();
    expect(scheduleNext).not.toHaveBeenCalled();
  });

  it("stops polling timers and resets transport buffers", () => {
    const close = vi.fn();
    const ws = {
      onmessage: vi.fn(),
      onerror: vi.fn(),
      onclose: vi.fn(),
      close,
    } as unknown as WebSocket;
    const clearTimeoutFn = vi.fn();
    const refs = {
      activeRef: { current: true },
      pollTimerRef: { current: 42 },
      wsRef: { current: ws },
      wsLineBufferRef: { current: ["line-1"] },
      httpUrlRef: { current: "https://example.com/logs" },
    };

    stopMonitorPollingState({
      ...refs,
      clearTimeoutFn,
    });

    expect(refs.activeRef.current).toBe(false);
    expect(clearTimeoutFn).toHaveBeenCalledWith(42);
    expect(close).toHaveBeenCalledTimes(1);
    expect(refs.pollTimerRef.current).toBeNull();
    expect(refs.wsRef.current).toBeNull();
    expect(refs.wsLineBufferRef.current).toEqual([]);
    expect(refs.httpUrlRef.current).toBe("");
  });

  it("swallows websocket close errors during cleanup", () => {
    const clearTimeoutFn = vi.fn();
    const refs = {
      activeRef: { current: true },
      pollTimerRef: { current: null as number | null },
      wsRef: {
        current: {
          onmessage: vi.fn(),
          onerror: vi.fn(),
          onclose: vi.fn(),
          close: vi.fn(() => {
            throw new Error("close boom");
          }),
        } as unknown as WebSocket,
      },
      wsLineBufferRef: { current: ["line-1"] },
      httpUrlRef: { current: "https://example.com/logs" },
    };

    expect(() =>
      stopMonitorPollingState({
        ...refs,
        clearTimeoutFn,
      }),
    ).not.toThrow();

    expect(refs.wsRef.current).toBeNull();
  });

  it("schedules the next poll only while active", () => {
    const setTimeoutFn = vi.fn(() => 99);
    const activeRef = { current: true };
    const pollTimerRef = { current: null as number | null };
    const doPoll = vi.fn(async () => undefined);

    scheduleMonitorPoll({
      activeRef,
      pollTimerRef,
      setTimeoutFn,
      doPoll,
    });

    expect(setTimeoutFn).toHaveBeenCalledTimes(1);
    expect(pollTimerRef.current).toBe(99);

    const scheduledHandler = setTimeoutFn.mock.calls[0]?.[0] as (() => void) | undefined;
    scheduledHandler?.();
    expect(doPoll).toHaveBeenCalledTimes(1);

    activeRef.current = false;
    scheduleMonitorPoll({
      activeRef,
      pollTimerRef,
      setTimeoutFn,
      doPoll,
    });
    expect(setTimeoutFn).toHaveBeenCalledTimes(1);
  });

  it("maps session poll results to listener updates", () => {
    const update = mapStreamPollResultToUpdate(createPollResult(), "/logs/runtime.log");

    expect(update.sourcePath).toBe("/logs/runtime.log");
    expect(update.toOffset).toBe(128);
    expect(update.anomalyMarkers).toHaveLength(1);
    expect(update.sonificationCues).toHaveLength(1);
  });

  it("falls back to offset zero when the stream session cursor is missing", () => {
    const update = mapStreamPollResultToUpdate(
      createPollResult({
        session: createSessionRecord({ fileCursor: undefined }),
      }),
      "/logs/runtime.log",
    );

    expect(update.fromOffset).toBe(0);
    expect(update.toOffset).toBe(0);
  });

  it("runs a direct poll cycle and resets cursor after repeated empty windows", async () => {
    const logger = createLogger();
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();
    const updates = [
      createUpdate({ hasData: false, toOffset: 128 }),
      createUpdate({ hasData: false, toOffset: 128 }),
      createUpdate({ hasData: false, toOffset: 128 }),
    ];
    const pollLogStream = vi
      .fn<(sourcePath: string, cursor?: number) => Promise<LiveLogStreamUpdate>>()
      .mockImplementation(async () => updates.shift() ?? createUpdate({ hasData: false }));

    const sessionRef = {
      current: createActiveMonitorSession({
        sessionId: "direct-1",
        repoId: "repo-1",
        repoTitle: "Direct session",
        sourcePath: "/logs/direct.log",
        adapterKind: "file",
        pollMode: "direct",
      }),
    };
    const directCursorRef = { current: 128 as number | undefined };
    const emptyWindowsRef = { current: 0 };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await runMonitorPollCycle({
        sessionRef,
        activeRef: { current: true },
        directCursorRef,
        emptyWindowsRef,
        wsLineBufferRef: { current: [] },
        httpUrlRef: { current: "" },
        pollStreamSession: vi.fn(),
        pollLogStream,
        ingestStreamChunk: vi.fn(),
        fetchText: vi.fn(),
        emitUpdate,
        scheduleNext,
        logger,
      });
    }

    expect(emitUpdate).toHaveBeenCalledTimes(3);
    expect(directCursorRef.current).toBeUndefined();
    expect(emptyWindowsRef.current).toBe(0);
    expect(scheduleNext).toHaveBeenCalledTimes(3);
  });

  it("resets empty direct windows when data arrives and logs the active offset", async () => {
    const logger = createLogger();
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();
    const update = createUpdate({ hasData: true, toOffset: 512, lineCount: 5 });
    const directCursorRef = { current: 128 as number | undefined };
    const emptyWindowsRef = { current: 2 };

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "direct-1",
          repoId: "repo-1",
          repoTitle: "Direct session",
          sourcePath: "/logs/direct.log",
          adapterKind: "file",
          pollMode: "direct",
        }),
      },
      activeRef: { current: true },
      directCursorRef,
      emptyWindowsRef,
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(async () => update),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate,
      scheduleNext,
      logger,
    });

    expect(directCursorRef.current).toBe(512);
    expect(emptyWindowsRef.current).toBe(0);
    expect(logger.debug).toHaveBeenCalled();
    expect(emitUpdate).toHaveBeenCalledWith(update);
  });

  it("stops direct and websocket poll cycles when the session deactivates mid-flight", async () => {
    const logger = createLogger();

    const directActiveRef = { current: true };
    const directEmitUpdate = vi.fn();
    const directScheduleNext = vi.fn();
    const directPollLogStream = vi.fn(async () => {
      directActiveRef.current = false;
      return createUpdate({ hasData: true, toOffset: 320 });
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "direct-stop",
          repoId: "repo-1",
          repoTitle: "Direct session",
          sourcePath: "/logs/direct.log",
          adapterKind: "file",
          pollMode: "direct",
        }),
      },
      activeRef: directActiveRef,
      directCursorRef: { current: 128 as number | undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: directPollLogStream,
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate: directEmitUpdate,
      scheduleNext: directScheduleNext,
      logger,
    });

    expect(directPollLogStream).toHaveBeenCalled();
    expect(directEmitUpdate).not.toHaveBeenCalled();
    expect(directScheduleNext).toHaveBeenCalledTimes(1);

    const websocketActiveRef = { current: true };
    const websocketEmitUpdate = vi.fn();
    const websocketScheduleNext = vi.fn();
    const websocketIngest = vi.fn(async () => {
      websocketActiveRef.current = false;
      return createPollResult();
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "ws-stop",
          repoId: "repo-1",
          repoTitle: "WS runtime",
          sourcePath: "ws://example.com/logs",
          adapterKind: "websocket",
          pollMode: "websocket",
        }),
      },
      activeRef: websocketActiveRef,
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: ["line-1"] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: websocketIngest,
      fetchText: vi.fn(),
      emitUpdate: websocketEmitUpdate,
      scheduleNext: websocketScheduleNext,
      logger,
    });

    expect(websocketIngest).toHaveBeenCalledWith("ws-stop", "line-1");
    expect(websocketEmitUpdate).not.toHaveBeenCalled();
    expect(websocketScheduleNext).toHaveBeenCalledTimes(1);
  });

  it("runs session poll cycles for session and http poll transports", async () => {
    const logger = createLogger();
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();
    const pollResult = createPollResult();
    const pollStreamSession = vi.fn(async () => pollResult);
    const ingestStreamChunk = vi.fn(async () => pollResult);
    const fetchText = vi.fn(async () => "line-1\nline-2");

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "session-1",
          repoId: "repo-1",
          repoTitle: "Session runtime",
          sourcePath: "/logs/session.log",
          adapterKind: "file",
          pollMode: "session",
        }),
      },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession,
      pollLogStream: vi.fn(),
      ingestStreamChunk,
      fetchText,
      emitUpdate,
      scheduleNext,
      logger,
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "http-1",
          repoId: "repo-1",
          repoTitle: "HTTP runtime",
          sourcePath: "https://example.com/logs",
          adapterKind: "http-poll",
          pollMode: "http-poll",
        }),
      },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "https://example.com/logs" },
      pollStreamSession,
      pollLogStream: vi.fn(),
      ingestStreamChunk,
      fetchText,
      emitUpdate,
      scheduleNext,
      logger,
    });

    expect(pollStreamSession).toHaveBeenCalledWith("session-1");
    expect(fetchText).toHaveBeenCalledWith("https://example.com/logs");
    expect(ingestStreamChunk).toHaveBeenCalledWith("http-1", "line-1\nline-2");
    expect(emitUpdate).toHaveBeenCalledTimes(2);
  });

  it("stops session poll cycles cleanly when the session deactivates after pollStreamSession", async () => {
    const logger = createLogger();
    const activeRef = { current: true };
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();
    const pollStreamSession = vi.fn(async () => {
      activeRef.current = false;
      return createPollResult();
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "session-stop",
          repoId: "repo-1",
          repoTitle: "Session runtime",
          sourcePath: "/logs/session.log",
          adapterKind: "file",
          pollMode: "session",
        }),
      },
      activeRef,
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession,
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate,
      scheduleNext,
      logger,
    });

    expect(pollStreamSession).toHaveBeenCalledWith("session-stop");
    expect(emitUpdate).not.toHaveBeenCalled();
    expect(scheduleNext).toHaveBeenCalledTimes(1);
  });

  it("runs websocket poll cycles by ingesting buffered lines", async () => {
    const logger = createLogger();
    const emitUpdate = vi.fn();
    const scheduleNext = vi.fn();
    const pollResult = createPollResult();
    const wsLineBufferRef = { current: ["line-1", "line-2"] };
    const ingestStreamChunk = vi.fn(async () => pollResult);

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "ws-1",
          repoId: "repo-1",
          repoTitle: "WS runtime",
          sourcePath: "ws://example.com/logs",
          adapterKind: "websocket",
          pollMode: "websocket",
        }),
      },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef,
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk,
      fetchText: vi.fn(),
      emitUpdate,
      scheduleNext,
      logger,
    });

    expect(ingestStreamChunk).toHaveBeenCalledWith("ws-1", "line-1\nline-2");
    expect(wsLineBufferRef.current).toEqual([]);
    expect(emitUpdate).toHaveBeenCalledTimes(1);
    expect(scheduleNext).toHaveBeenCalledTimes(1);
  });

  it("stops http-poll progression cleanly when the session deactivates after fetch or ingest", async () => {
    const logger = createLogger();
    const pollResult = createPollResult();

    const activeAfterFetch = { current: true };
    const emitAfterFetch = vi.fn();
    const scheduleAfterFetch = vi.fn();
    const fetchTextAfterFetch = vi.fn(async () => {
      activeAfterFetch.current = false;
      return "line-1";
    });
    const ingestAfterFetch = vi.fn(async () => pollResult);

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "http-fetch-stop",
          repoId: "repo-1",
          repoTitle: "HTTP runtime",
          sourcePath: "https://example.com/logs",
          adapterKind: "http-poll",
          pollMode: "http-poll",
        }),
      },
      activeRef: activeAfterFetch,
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "https://example.com/logs" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: ingestAfterFetch,
      fetchText: fetchTextAfterFetch,
      emitUpdate: emitAfterFetch,
      scheduleNext: scheduleAfterFetch,
      logger,
    });

    expect(fetchTextAfterFetch).toHaveBeenCalledWith("https://example.com/logs");
    expect(ingestAfterFetch).not.toHaveBeenCalled();
    expect(emitAfterFetch).not.toHaveBeenCalled();
    expect(scheduleAfterFetch).toHaveBeenCalledTimes(1);

    const activeAfterIngest = { current: true };
    const emitAfterIngest = vi.fn();
    const scheduleAfterIngest = vi.fn();
    const ingestAfterIngest = vi.fn(async () => {
      activeAfterIngest.current = false;
      return pollResult;
    });

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "http-ingest-stop",
          repoId: "repo-1",
          repoTitle: "HTTP runtime",
          sourcePath: "https://example.com/logs",
          adapterKind: "http-poll",
          pollMode: "http-poll",
        }),
      },
      activeRef: activeAfterIngest,
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "https://example.com/logs" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: ingestAfterIngest,
      fetchText: vi.fn(async () => "line-1"),
      emitUpdate: emitAfterIngest,
      scheduleNext: scheduleAfterIngest,
      logger,
    });

    expect(ingestAfterIngest).toHaveBeenCalledWith("http-ingest-stop", "line-1");
    expect(emitAfterIngest).not.toHaveBeenCalled();
    expect(scheduleAfterIngest).toHaveBeenCalledTimes(1);
  });

  it("logs non-fatal polling errors and still schedules the next cycle", async () => {
    const logger = createLogger();
    const scheduleNext = vi.fn();

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "session-1",
          repoId: "repo-1",
          repoTitle: "Session runtime",
          sourcePath: "/logs/session.log",
          adapterKind: "file",
          pollMode: "session",
        }),
      },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(async () => {
        throw new Error("poll boom");
      }),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate: vi.fn(),
      scheduleNext,
      logger,
    });

    expect(logger.error).toHaveBeenCalled();
    expect(scheduleNext).toHaveBeenCalledTimes(1);
  });

  it("logs non-Error polling failures without crashing", async () => {
    const logger = createLogger();
    const scheduleNext = vi.fn();

    await runMonitorPollCycle({
      sessionRef: {
        current: createActiveMonitorSession({
          sessionId: "session-1",
          repoId: "repo-1",
          repoTitle: "Session runtime",
          sourcePath: "/logs/session.log",
          adapterKind: "file",
          pollMode: "session",
        }),
      },
      activeRef: { current: true },
      directCursorRef: { current: undefined },
      emptyWindowsRef: { current: 0 },
      wsLineBufferRef: { current: [] },
      httpUrlRef: { current: "" },
      pollStreamSession: vi.fn(async () => {
        throw "plain failure";
      }),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate: vi.fn(),
      scheduleNext,
      logger,
    });

    expect(logger.error).toHaveBeenCalledWith("poll error (non-fatal, will retry): plain failure");
    expect(scheduleNext).toHaveBeenCalledTimes(1);
  });

  it("creates live monitor sessions from repo and start input data", () => {
    const sessionInput: StartSessionInput = {
      sessionId: "stream-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      trackId: "track-1",
      trackTitle: "Base Pulse",
      sourceTemplateId: "house-file-tail",
    };

    const session = createLiveMonitorSession({
      repo: createRepository(),
      sessionInput,
      pollMode: "session",
      persistedSessionId: "persisted-1",
    });

    expect(session.repoTitle).toBe("visits-service");
    expect(session.trackName).toBe("Base Pulse");
    expect(session.persistedSessionId).toBe("persisted-1");
    expect(session.pollMode).toBe("session");
  });

  it("creates live monitor sessions with a null persisted session id when omitted", () => {
    const sessionInput: StartSessionInput = {
      sessionId: "stream-2",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      sourceTemplateId: "house-file-tail",
    };

    const session = createLiveMonitorSession({
      repo: createRepository(),
      sessionInput,
      pollMode: "direct",
    });

    expect(session.persistedSessionId).toBeNull();
    expect(session.trackName).toBe("Dynamic Track");
  });

  it("creates active monitor sessions with default track labels and startedAt fallback", () => {
    const before = Date.now();
    const session = createActiveMonitorSession({
      sessionId: "direct-1",
      repoId: "repo-1",
      repoTitle: "Direct session",
      sourcePath: "/logs/direct.log",
      adapterKind: "file",
      pollMode: "direct",
    });
    const after = Date.now();

    expect(session.trackName).toBe("Dynamic Track");
    expect(session.startedAt).toBeGreaterThanOrEqual(before);
    expect(session.startedAt).toBeLessThanOrEqual(after);
  });
});
