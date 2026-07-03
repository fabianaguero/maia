import { describe, expect, it, vi } from "vitest";

import {
  buildEmitMonitorProviderUpdateStateInput,
  buildRunMonitorProviderPollStateInput,
} from "../../../src/features/monitor/monitorProviderUpdateStateRuntime";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";

function createUpdate(): LiveLogStreamUpdate {
  return {
    summary: "window",
    dominantLevel: "info",
    confidence: 0.7,
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { info: 3 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    fromOffset: 0,
    toOffset: 128,
    suggestedBpm: 126,
  };
}

describe("monitorProviderUpdateStateRuntime", () => {
  it("builds emit-update state with persistence adapters", () => {
    const updatePersistedSessionCursor = vi.fn(async () => undefined);
    const insertSessionEvent = vi.fn(async () => undefined);

    const state = buildEmitMonitorProviderUpdateStateInput({
      update: createUpdate(),
      listenersRef: { current: new Set() },
      sessionRef: { current: { persistedSessionId: "persisted-1" } as never },
      pollIndexRef: { current: 0 },
      audioContextRef: { current: null },
      setMetrics: vi.fn(),
      updatePersistedSessionCursor,
      insertSessionEvent,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
      options: { persistPlaybackEvent: false },
    });

    state.updatePersistedCursor({
      sessionId: "persisted-1",
      toOffset: 512,
      lineCount: 9,
      anomalyCount: 2,
      suggestedBpm: 128,
    });
    state.insertPersistedEvent({
      sessionId: "persisted-1",
      pollIndex: 1,
      fromOffset: 0,
      toOffset: 10,
      summary: "window",
      suggestedBpm: 126,
      confidence: 0.7,
      dominantLevel: "info",
      lineCount: 3,
      anomalyCount: 1,
      levelCountsJson: "{}",
      anomalyMarkersJson: "[]",
      topComponentsJson: "[]",
      sonificationCuesJson: "[]",
      parsedLinesJson: "[]",
      warningsJson: "[]",
    });

    expect(updatePersistedSessionCursor).toHaveBeenCalledWith("persisted-1", 512, 9, 2, 128);
    expect(insertSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "persisted-1", summary: "window" }),
    );
  });

  it("builds provider poll state from the shared refs and handlers", () => {
    const doPoll = vi.fn(async () => undefined);
    const schedulePoll = vi.fn();
    const state = buildRunMonitorProviderPollStateInput({
      sessionRef: { current: null },
      activeRef: { current: true },
      directCursorRef: { current: 64 as number | undefined },
      emptyWindowsRef: { current: 1 },
      wsLineBufferRef: { current: ["line"] },
      httpUrlRef: { current: "http://localhost:9999/logs" },
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(),
      emitUpdate: vi.fn(),
      schedulePoll,
      doPoll,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
    });

    expect(state.httpUrlRef.current).toBe("http://localhost:9999/logs");
    expect(state.schedulePoll).toBe(schedulePoll);
    expect(state.doPoll).toBe(doPoll);
  });
});
