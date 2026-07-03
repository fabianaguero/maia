import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  handleReplayTickEndState,
  scheduleNextReplayTick,
  shouldRunReplayTick,
} from "../../../src/features/monitor/monitorReplayTickLifecycleRuntime";

function createEvent(index: number): SessionEvent {
  return {
    id: index + 1,
    sessionId: "persisted-1",
    pollIndex: index,
    capturedAt: "2026-06-26T00:00:00.000Z",
    fromOffset: index * 100,
    toOffset: index * 100 + 100,
    summary: `window-${index}`,
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: "warn",
    lineCount: 4,
    anomalyCount: index % 2,
    levelCountsJson: JSON.stringify({ warn: 1 }),
    anomalyMarkersJson: JSON.stringify([]),
    topComponentsJson: JSON.stringify([]),
    sonificationCuesJson: JSON.stringify([]),
    parsedLinesJson: JSON.stringify([`line-${index}`]),
    warningsJson: JSON.stringify([]),
  };
}

describe("monitorReplayTickLifecycleRuntime", () => {
  it("guards execution when replay is inactive or paused", () => {
    expect(
      shouldRunReplayTick({
        activeRef: { current: true },
        playbackPausedRef: { current: false },
      }),
    ).toBe(true);

    expect(
      shouldRunReplayTick({
        activeRef: { current: false },
        playbackPausedRef: { current: false },
      }),
    ).toBe(false);
  });

  it("retries shortly while replay hydration is still in progress", () => {
    const setTimeoutFn = vi.fn(() => 21);
    const pollTimerRef = { current: null as number | null };

    const handled = handleReplayTickEndState({
      replayHydratingRef: { current: true },
      pollTimerRef,
      setTimeoutFn,
      replayTick: vi.fn(),
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      setIsPlaybackPaused: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      stopAllMonitorAudio: vi.fn(),
      logger: { info: vi.fn() },
      replayEventsRef: { current: [createEvent(0)] },
      replayIndexRef: { current: 1 },
    });

    expect(handled).toBe(true);
    expect(setTimeoutFn).toHaveBeenCalledWith(expect.any(Function), 200);
    expect(pollTimerRef.current).toBe(21);
  });

  it("stops replay cleanly at the end and schedules the next tick after a dispatched event", () => {
    const activeRef = { current: true };
    const playbackPausedRef = { current: false };
    const setIsPlaybackPaused = vi.fn();
    const syncReplayTelemetry = vi.fn();
    const stopAllMonitorAudio = vi.fn();
    const logger = { info: vi.fn() };
    const replayEventsRef = { current: [createEvent(0)] };
    const replayIndexRef = { current: 1 };

    const handled = handleReplayTickEndState({
      replayHydratingRef: { current: false },
      pollTimerRef: { current: null },
      setTimeoutFn: vi.fn(),
      replayTick: vi.fn(),
      activeRef,
      playbackPausedRef,
      setIsPlaybackPaused,
      syncReplayTelemetry,
      stopAllMonitorAudio,
      logger,
      replayEventsRef,
      replayIndexRef,
    });

    expect(handled).toBe(true);
    expect(activeRef.current).toBe(false);
    expect(playbackPausedRef.current).toBe(true);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(true);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(1);
    expect(stopAllMonitorAudio).toHaveBeenCalledTimes(1);

    const pollTimerRef = { current: null as number | null };
    const setTimeoutFn = vi.fn(() => 33);
    scheduleNextReplayTick({
      logger,
      replayIndexRef: { current: 1 },
      replayEventsRef: { current: [createEvent(0), createEvent(1), createEvent(2)] },
      pollTimerRef,
      setTimeoutFn,
      replayTick: vi.fn(),
      intervalMs: 600,
    });

    expect(setTimeoutFn).toHaveBeenCalledWith(expect.any(Function), 600);
    expect(pollTimerRef.current).toBe(33);
  });
});
