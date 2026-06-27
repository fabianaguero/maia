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
});
