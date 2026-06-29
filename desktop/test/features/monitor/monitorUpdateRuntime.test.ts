import { describe, expect, it, vi } from "vitest";

import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import type { MonitorMetrics } from "../../../src/features/monitor/monitorContextTypes";
import {
  applyMonitorStreamUpdateState,
  accumulateMonitorMetrics,
  buildSessionEventInsertInput,
  dispatchMonitorStreamListeners,
  subscribeToMonitorStreamState,
} from "../../../src/features/monitor/monitorUpdateRuntime";

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 100,
    toOffset: 220,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.72,
    dominantLevel: "warn",
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1 },
    anomalyMarkers: [{ eventIndex: 1, level: "error", component: "payments", excerpt: "500" }],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [
      {
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
      },
    ],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

describe("monitorUpdateRuntime", () => {
  it("accumulates monitor metrics from live updates", () => {
    const previous: MonitorMetrics = {
      windowCount: 4,
      processedLines: 12,
      totalAnomalies: 2,
    };

    expect(accumulateMonitorMetrics(previous, createUpdate())).toEqual({
      windowCount: 5,
      processedLines: 15,
      totalAnomalies: 3,
    } satisfies MonitorMetrics);
  });

  it("builds persisted session event payloads from updates", () => {
    const input = buildSessionEventInsertInput({
      sessionId: "persisted-1",
      pollIndex: 7,
      update: createUpdate(),
    });

    expect(input.sessionId).toBe("persisted-1");
    expect(input.pollIndex).toBe(7);
    expect(input.fromOffset).toBe(100);
    expect(input.toOffset).toBe(220);
    expect(JSON.parse(input.sonificationCuesJson)).toHaveLength(1);
    expect(JSON.parse(input.anomalyMarkersJson)).toHaveLength(1);
    expect(JSON.parse(input.parsedLinesJson)).toEqual(["WARN queue depth rising"]);
  });

  it("dispatches updates to every subscribed listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const update = createUpdate();

    const dispatched = dispatchMonitorStreamListeners(new Set([first, second]), update);

    expect(dispatched).toBe(2);
    expect(first).toHaveBeenCalledWith(update);
    expect(second).toHaveBeenCalledWith(update);
  });

  it("applies monitor update state including metrics, persistence and listener dispatch", () => {
    const listener = vi.fn();
    const setMetrics = vi.fn();
    const resumeSuspendedAudioContext = vi.fn();
    const updatePersistedCursor = vi.fn();
    const insertPersistedEvent = vi.fn();
    const logger = { info: vi.fn(), debug: vi.fn(), trace: vi.fn() };

    const result = applyMonitorStreamUpdateState({
      update: createUpdate(),
      listeners: new Set([listener]),
      persistedSessionId: "persisted-1",
      pollIndex: 4,
      setMetrics,
      resumeSuspendedAudioContext,
      updatePersistedCursor,
      insertPersistedEvent,
      logger,
    });

    expect(result.nextPollIndex).toBe(5);
    expect(result.dispatchedListeners).toBe(1);
    expect(resumeSuspendedAudioContext).toHaveBeenCalledTimes(1);
    expect(setMetrics).toHaveBeenCalledTimes(1);
    expect(updatePersistedCursor).toHaveBeenCalledWith({
      sessionId: "persisted-1",
      toOffset: 220,
      lineCount: 3,
      anomalyCount: 1,
      suggestedBpm: 126,
    });
    expect(insertPersistedEvent).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ summary: "tail active" }));
  });

  it("skips persistence and metric accumulation when update has no data or options disable it", () => {
    const listener = vi.fn();
    const setMetrics = vi.fn();
    const resumeSuspendedAudioContext = vi.fn();
    const updatePersistedCursor = vi.fn();
    const insertPersistedEvent = vi.fn();

    const result = applyMonitorStreamUpdateState({
      update: createUpdate({ hasData: false }),
      listeners: new Set([listener]),
      persistedSessionId: "persisted-1",
      pollIndex: 9,
      accumulateMetrics: false,
      persistPlaybackEvent: false,
      setMetrics,
      resumeSuspendedAudioContext,
      updatePersistedCursor,
      insertPersistedEvent,
    });

    expect(result.nextPollIndex).toBe(9);
    expect(result.dispatchedListeners).toBe(1);
    expect(resumeSuspendedAudioContext).not.toHaveBeenCalled();
    expect(setMetrics).not.toHaveBeenCalled();
    expect(updatePersistedCursor).not.toHaveBeenCalled();
    expect(insertPersistedEvent).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("registers and unregisters listener subscriptions", () => {
    const listeners = new Set<(update: LiveLogStreamUpdate) => void>();
    const listener = vi.fn();
    const logger = { info: vi.fn() };

    const unsubscribe = subscribeToMonitorStreamState({
      listeners,
      listener,
      logger,
    });

    expect(listeners.has(listener)).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("subscribe → listeners=%d", 1);

    unsubscribe();

    expect(listeners.has(listener)).toBe(false);
    expect(logger.info).toHaveBeenCalledWith("unsubscribe → listeners=%d", 0);
  });
});
