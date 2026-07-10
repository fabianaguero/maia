import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import type { MonitorMetrics } from "../../../src/features/monitor/monitorContextTypes";
import type { GuideTrackPCM } from "../../../src/features/monitor/monitorAudioRuntimeTypes";
import type { LiveLogCue, LiveLogStreamUpdate } from "../../../src/types/monitor";
import {
  buildReplayUpdateFromEvent,
  createEmptyMonitorMetrics,
  rebuildReplayEventsFromSource,
  resetReplayTelemetryState,
  shouldHydrateReplayFromSource,
  syncGuideTrackCursorToReplayProgress,
  syncReplayTelemetryState,
} from "../../../src/features/monitor/monitorReplayRuntime";

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
    anomalyMarkers: [{ eventIndex: 1, level: "error", component: "payments", excerpt: "500" }],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [createCue()],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

function createEvent(pollIndex: number): SessionEvent {
  return {
    id: pollIndex + 1,
    sessionId: "persisted-1",
    pollIndex,
    capturedAt: "2026-06-25T20:00:00.000Z",
    fromOffset: pollIndex * 100,
    toOffset: pollIndex * 100 + 100,
    summary: `window-${pollIndex}`,
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: pollIndex % 2 === 0 ? "warn" : "info",
    lineCount: 4,
    anomalyCount: pollIndex % 2 === 0 ? 1 : 0,
    levelCountsJson: JSON.stringify({ warn: 1, info: 3 }),
    anomalyMarkersJson: JSON.stringify([{ eventIndex: pollIndex + 1 }]),
    topComponentsJson: JSON.stringify([{ component: "queue", count: 2 }]),
    sonificationCuesJson: JSON.stringify([createCue({ eventIndex: pollIndex + 1 })]),
    parsedLinesJson: JSON.stringify([`line-${pollIndex}`]),
    warningsJson: JSON.stringify([]),
  };
}

describe("monitorReplayRuntime", () => {
  it("creates empty metrics and resets replay telemetry state", () => {
    const replayEventsRef = { current: [createEvent(0)] };
    const replayMetricsRef = {
      current: [{ windowCount: 2, processedLines: 8, totalAnomalies: 1 }] as MonitorMetrics[],
    };
    const replayIndexRef = { current: 2 };
    const replayHydratingRef = { current: true };
    const replayHydrationTokenRef = { current: 4 };
    const playbackPausedRef = { current: true };
    const setPlaybackProgress = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const setPlaybackEventIndex = vi.fn();
    const setPlaybackEventCount = vi.fn();

    expect(createEmptyMonitorMetrics()).toEqual({
      windowCount: 0,
      processedLines: 0,
      totalAnomalies: 0,
    });

    resetReplayTelemetryState({
      replayEventsRef,
      replayMetricsRef,
      replayIndexRef,
      replayHydratingRef,
      replayHydrationTokenRef,
      playbackPausedRef,
      setPlaybackProgress,
      setIsPlaybackPaused,
      setPlaybackEventIndex,
      setPlaybackEventCount,
    });

    expect(replayEventsRef.current).toEqual([]);
    expect(replayMetricsRef.current).toEqual([createEmptyMonitorMetrics()]);
    expect(replayIndexRef.current).toBe(0);
    expect(replayHydratingRef.current).toBe(false);
    expect(replayHydrationTokenRef.current).toBe(5);
    expect(playbackPausedRef.current).toBe(false);
    expect(setPlaybackProgress).toHaveBeenCalledWith(null);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(false);
  });

  it("syncs telemetry counters and maps replay events back to updates", () => {
    const replayEventsRef = { current: [createEvent(0), createEvent(1)] };
    const replayMetricsRef = {
      current: [
        createEmptyMonitorMetrics(),
        { windowCount: 1, processedLines: 4, totalAnomalies: 1 },
        { windowCount: 2, processedLines: 8, totalAnomalies: 1 },
      ] satisfies MonitorMetrics[],
    };
    const setPlaybackEventCount = vi.fn();
    const setPlaybackEventIndex = vi.fn();
    const setPlaybackProgress = vi.fn();
    const setMetrics = vi.fn();

    syncReplayTelemetryState({
      processedEvents: 5,
      replayEventsRef,
      replayMetricsRef,
      setPlaybackEventCount,
      setPlaybackEventIndex,
      setPlaybackProgress,
      setMetrics,
    });

    expect(setPlaybackEventCount).toHaveBeenCalledWith(2);
    expect(setPlaybackEventIndex).toHaveBeenCalledWith(2);
    expect(setPlaybackProgress).toHaveBeenCalledWith(1);
    expect(setMetrics).toHaveBeenCalledWith({
      windowCount: 2,
      processedLines: 8,
      totalAnomalies: 1,
    });

    const update = buildReplayUpdateFromEvent(createEvent(1), "/logs/replay.log", 2);
    expect(update.sourcePath).toBe("/logs/replay.log");
    expect(update.replayWindowIndex).toBe(2);
    expect(update.parsedLines).toEqual(["line-1"]);
  });

  it("syncs guide track cursor and decides replay hydration need", () => {
    const pcm: GuideTrackPCM = {
      samples: new Float32Array(1000).fill(0.25),
      sampleRate: 44100,
      durationSec: 1,
    };
    const cursorRef = { current: { current: 0 } };
    const finishedRef = { current: true };

    syncGuideTrackCursorToReplayProgress({
      pcm,
      cursorRef,
      finishedRef,
      progress: 0.5,
    });

    expect(cursorRef.current.current).toBe(500);
    expect(finishedRef.current).toBe(false);
    expect(shouldHydrateReplayFromSource(0, "/logs/replay.log")).toBe(true);
    expect(shouldHydrateReplayFromSource(4, "/logs/replay.log")).toBe(true);
    expect(shouldHydrateReplayFromSource(5, "/logs/replay.log", 0)).toBe(true);
    expect(shouldHydrateReplayFromSource(5, "/logs/replay.log", 20)).toBe(false);
  });

  it("rebuilds replay events from a log source until no more data", async () => {
    const pollLogStream = vi
      .fn()
      .mockResolvedValueOnce(createUpdate({ fromOffset: 0, toOffset: 128 }))
      .mockResolvedValueOnce(createUpdate({ fromOffset: 128, toOffset: 256 }))
      .mockResolvedValueOnce(createUpdate({ hasData: false, fromOffset: 256, toOffset: 256 }));

    const rebuilt = await rebuildReplayEventsFromSource({
      sessionId: "persisted-1",
      sourcePath: "/logs/replay.log",
      pollLogStream,
      rebuildWindowBytes: 1024,
      maxReplayWindows: 8,
    });

    expect(rebuilt).toHaveLength(2);
    expect(rebuilt[0]?.pollIndex).toBe(0);
    expect(rebuilt[1]?.pollIndex).toBe(1);
    expect(pollLogStream).toHaveBeenNthCalledWith(1, "/logs/replay.log", 0, 1024);
    expect(pollLogStream).toHaveBeenNthCalledWith(2, "/logs/replay.log", 128, 1024);
  });
});
