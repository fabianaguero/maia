import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import {
  clearReplayTimer,
  dispatchReplayEventAtIndexState,
  runReplayTickState,
} from "../../../src/features/monitor/monitorReplayTickRuntime";

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

function createSession(): ActiveMonitorSession {
  return {
    sessionId: "playback_persisted-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "Replay",
    sourcePath: "/logs/replay.log",
    adapterKind: "file",
    pollMode: "direct",
    startedAt: 123,
  };
}

describe("monitorReplayTickRuntime", () => {
  it("clears timers and dispatches replay windows", () => {
    const clearTimeoutFn = vi.fn();
    const pollTimerRef = { current: 45 as number | null };

    clearReplayTimer({ pollTimerRef, clearTimeoutFn });

    expect(clearTimeoutFn).toHaveBeenCalledWith(45);
    expect(pollTimerRef.current).toBeNull();

    const replayEventsRef = { current: [createEvent(0), createEvent(1)] };
    const replayIndexRef = { current: 0 };
    const sessionRef = { current: createSession() as ActiveMonitorSession | null };
    const emitUpdate = vi.fn<
      [LiveLogStreamUpdate, { accumulateMetrics?: boolean; persistPlaybackEvent?: boolean }?],
      void
    >();
    const syncReplayTelemetry = vi.fn();
    const syncGuideTrackToReplayProgress = vi.fn();

    const ok = dispatchReplayEventAtIndexState({
      eventIndex: 1,
      replayEventsRef,
      replayIndexRef,
      sessionRef,
      emitUpdate,
      syncReplayTelemetry,
      syncGuideTrackToReplayProgress,
      syncGuideTrack: true,
    });

    expect(ok).toBe(true);
    expect(replayIndexRef.current).toBe(2);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(2);
    expect(syncGuideTrackToReplayProgress).toHaveBeenCalledWith(0.5);
  });

  it("runs replay tick and schedules the next event", () => {
    const setTimeoutFn = vi.fn(() => 88);
    const dispatchReplayEventAtIndex = vi.fn(() => true);
    const syncReplayTelemetry = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const stopAllMonitorAudio = vi.fn();
    const logger = { info: vi.fn() };
    const replayTick = vi.fn();
    const pollTimerRef = { current: null as number | null };

    runReplayTickState({
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      replayEventsRef: { current: [createEvent(0), createEvent(1)] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      pollTimerRef,
      setTimeoutFn,
      intervalMs: 600,
      dispatchReplayEventAtIndex,
      syncReplayTelemetry,
      setIsPlaybackPaused,
      stopAllMonitorAudio,
      logger,
      replayTick,
    });

    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(0);
    expect(setTimeoutFn).toHaveBeenCalledWith(replayTick, 600);
    expect(pollTimerRef.current).toBe(88);
    expect(stopAllMonitorAudio).not.toHaveBeenCalled();
  });
});
