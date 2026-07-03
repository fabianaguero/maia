import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  buildDispatchReplayEventAtIndexStateInput,
  buildRunReplayTickStateInput,
  buildSyncGuideTrackCursorStateInput,
  buildSyncReplayTelemetryStateInput,
} from "../../../src/features/monitor/monitorProviderReplayStateRuntime";

function createReplayEvent(): SessionEvent {
  return {
    id: 1,
    sessionId: "persisted-1",
    pollIndex: 1,
    capturedAt: "2026-06-29T00:00:00.000Z",
    fromOffset: 0,
    toOffset: 10,
    summary: "event-1",
    suggestedBpm: 126,
    confidence: 0.9,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCountsJson: "{}",
    anomalyMarkersJson: "[]",
    topComponentsJson: "[]",
    sonificationCuesJson: "[]",
    parsedLinesJson: "[]",
    warningsJson: "[]",
  };
}

describe("monitorProviderReplayStateRuntime", () => {
  it("builds replay, telemetry and guide-track sync state", () => {
    const replayEventsRef = { current: [createReplayEvent()] };
    const telemetryState = buildSyncReplayTelemetryStateInput({
      processedEvents: 1,
      replayEventsRef,
      replayMetricsRef: { current: [] },
      setPlaybackEventCount: vi.fn(),
      setPlaybackEventIndex: vi.fn(),
      setPlaybackProgress: vi.fn(),
      setMetrics: vi.fn(),
    });
    const replayState = buildDispatchReplayEventAtIndexStateInput({
      eventIndex: 0,
      replayEventsRef,
      replayIndexRef: { current: 0 },
      sessionRef: { current: null },
      emitUpdate: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      syncGuideTrackToReplayProgress: vi.fn(),
      syncGuideTrack: true,
    });
    const guideTrackState = buildSyncGuideTrackCursorStateInput({
      pcm: null,
      cursorRef: { current: { current: 0 } },
      finishedRef: { current: false },
      progress: 0.25,
    });

    expect(telemetryState.replayEventsRef).toBe(replayEventsRef);
    expect(replayState.replayEventsRef).toBe(replayEventsRef);
    expect(guideTrackState.progress).toBe(0.25);
  });

  it("builds replay tick state with the expected timeout and control wiring", () => {
    const replayTick = vi.fn();
    const state = buildRunReplayTickStateInput({
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      replayEventsRef: { current: [createReplayEvent()] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      pollTimerRef: { current: null },
      intervalMs: 600,
      dispatchReplayEventAtIndex: vi.fn(() => true),
      syncReplayTelemetry: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      stopAllMonitorAudio: vi.fn(),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
      replayTick,
    });

    expect(state.intervalMs).toBe(600);
    expect(state.replayTick).toBe(replayTick);
    expect(state.setTimeoutFn).toBe(window.setTimeout);
  });
});
