import { describe, expect, it, vi, beforeEach } from "vitest";

import type { InsertSessionEventInput } from "../../../src/api/sessions";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import {
  emitMonitorProviderUpdateState,
  runMonitorProviderPollState,
} from "../../../src/features/monitor/monitorProviderLiveRuntime";
import { runMonitorPollCycle } from "../../../src/features/monitor/monitorSessionRuntime";

vi.mock("../../../src/features/monitor/monitorSessionRuntime", async () => {
  const actual = await vi.importActual("../../../src/features/monitor/monitorSessionRuntime");

  return {
    ...actual,
    runMonitorPollCycle: vi.fn(),
  };
});

function createUpdate(overrides?: Partial<LiveLogStreamUpdate>): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/monitor.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "window",
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: "warn",
    lineCount: 5,
    anomalyCount: 1,
    levelCounts: { info: 3, warn: 1, error: 1 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["line-a", "line-b"],
    warnings: [],
    ...overrides,
  };
}

describe("monitorProviderLiveRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies stream updates through provider refs and advances persisted poll index", () => {
    const listenersRef = { current: new Set([vi.fn()]) };
    const sessionRef = { current: { persistedSessionId: "persisted-1" } };
    const pollIndexRef = { current: 4 };
    const resume = vi.fn();
    const audioContextRef = {
      current: {
        state: "suspended",
        resume,
      } as unknown as AudioContext,
    };
    const setMetrics = vi.fn();
    const updatePersistedCursor = vi.fn();
    const insertPersistedEvent = vi.fn<[InsertSessionEventInput], void>();

    const result = emitMonitorProviderUpdateState({
      update: createUpdate(),
      listenersRef,
      sessionRef: sessionRef as never,
      pollIndexRef,
      audioContextRef,
      setMetrics,
      updatePersistedCursor,
      insertPersistedEvent,
      logger: { info: vi.fn(), debug: vi.fn(), trace: vi.fn() },
    });

    expect(result.nextPollIndex).toBe(5);
    expect(result.dispatchedListeners).toBe(1);
    expect(pollIndexRef.current).toBe(5);
    expect(resume).toHaveBeenCalled();
    expect(updatePersistedCursor).toHaveBeenCalledWith({
      sessionId: "persisted-1",
      toOffset: 128,
      lineCount: 5,
      anomalyCount: 1,
      suggestedBpm: 126,
    });
    expect(insertPersistedEvent).toHaveBeenCalledTimes(1);
  });

  it("delegates poll execution and reschedules through the provider schedule callback", async () => {
    vi.mocked(runMonitorPollCycle).mockImplementationOnce(async (input) => {
      input.scheduleNext();
    });

    const doPoll = vi.fn(async () => undefined);
    const schedulePoll = vi.fn();

    await runMonitorProviderPollState({
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
      emitUpdate: vi.fn(),
      schedulePoll,
      doPoll,
      logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
    });

    expect(runMonitorPollCycle).toHaveBeenCalledTimes(1);
    expect(schedulePoll).toHaveBeenCalledWith(doPoll);
  });

  it("does not resume audio when there is no suspended audio context", () => {
    const listenersRef = { current: new Set([vi.fn()]) };
    const sessionRef = { current: { persistedSessionId: null } };
    const pollIndexRef = { current: 0 };
    const runningResume = vi.fn();
    const setMetrics = vi.fn();
    const updatePersistedCursor = vi.fn();
    const insertPersistedEvent = vi.fn<[InsertSessionEventInput], void>();

    emitMonitorProviderUpdateState({
      update: createUpdate(),
      listenersRef,
      sessionRef: sessionRef as never,
      pollIndexRef,
      audioContextRef: {
        current: {
          state: "running",
          resume: runningResume,
        } as unknown as AudioContext,
      },
      setMetrics,
      updatePersistedCursor,
      insertPersistedEvent,
      logger: { info: vi.fn(), debug: vi.fn(), trace: vi.fn() },
    });

    emitMonitorProviderUpdateState({
      update: createUpdate(),
      listenersRef,
      sessionRef: sessionRef as never,
      pollIndexRef,
      audioContextRef: { current: null },
      setMetrics,
      updatePersistedCursor,
      insertPersistedEvent,
      logger: { info: vi.fn(), debug: vi.fn(), trace: vi.fn() },
    });

    expect(runningResume).not.toHaveBeenCalled();
  });
});
