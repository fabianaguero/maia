import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import {
  clearReplayTimer,
  dispatchReplayEventAtIndexState,
  pauseReplayPlaybackState,
  resumeReplayPlaybackState,
  runReplayTickState,
  seekReplayPlaybackState,
  seekReplayWindowState,
  stepReplayPlaybackWindowState,
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

  it("returns false when replay dispatch has no events and clamps indices safely", () => {
    const replayEventsRef = { current: [] as SessionEvent[] };
    const replayIndexRef = { current: 0 };
    const emitUpdate = vi.fn();
    const syncReplayTelemetry = vi.fn();

    expect(
      dispatchReplayEventAtIndexState({
        eventIndex: 99,
        replayEventsRef,
        replayIndexRef,
        sessionRef: { current: null },
        emitUpdate,
        syncReplayTelemetry,
      }),
    ).toBe(false);

    replayEventsRef.current = [createEvent(0), createEvent(1)];

    expect(
      dispatchReplayEventAtIndexState({
        eventIndex: 99,
        replayEventsRef,
        replayIndexRef,
        sessionRef: { current: createSession() as ActiveMonitorSession | null },
        emitUpdate,
        syncReplayTelemetry,
      }),
    ).toBe(true);

    expect(replayIndexRef.current).toBe(2);
    expect(syncReplayTelemetry).toHaveBeenLastCalledWith(2);
    expect(emitUpdate).toHaveBeenCalledTimes(1);
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

  it("stops replay at the end and retries briefly while hydration is still in progress", () => {
    const logger = { info: vi.fn() };
    const setTimeoutFn = vi.fn(() => 21);
    const syncReplayTelemetry = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const stopAllMonitorAudio = vi.fn();
    const replayTick = vi.fn();
    const hydratingPollTimerRef = { current: null as number | null };

    runReplayTickState({
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      replayEventsRef: { current: [createEvent(0)] },
      replayIndexRef: { current: 1 },
      replayHydratingRef: { current: true },
      pollTimerRef: hydratingPollTimerRef,
      setTimeoutFn,
      intervalMs: 600,
      dispatchReplayEventAtIndex: vi.fn(),
      syncReplayTelemetry,
      setIsPlaybackPaused,
      stopAllMonitorAudio,
      logger,
      replayTick,
    });

    expect(setTimeoutFn).toHaveBeenCalledWith(replayTick, 200);
    expect(hydratingPollTimerRef.current).toBe(21);

    const activeRef = { current: true };
    const playbackPausedRef = { current: false };

    runReplayTickState({
      activeRef,
      playbackPausedRef,
      replayEventsRef: { current: [createEvent(0)] },
      replayIndexRef: { current: 1 },
      replayHydratingRef: { current: false },
      pollTimerRef: { current: null },
      setTimeoutFn: vi.fn(),
      intervalMs: 600,
      dispatchReplayEventAtIndex: vi.fn(),
      syncReplayTelemetry,
      setIsPlaybackPaused,
      stopAllMonitorAudio,
      logger,
      replayTick,
    });

    expect(activeRef.current).toBe(false);
    expect(playbackPausedRef.current).toBe(true);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(true);
    expect(syncReplayTelemetry).toHaveBeenLastCalledWith(1);
    expect(stopAllMonitorAudio).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalled();
  });

  it("stops replay immediately when dispatching the next event fails", () => {
    const activeRef = { current: true };

    runReplayTickState({
      activeRef,
      playbackPausedRef: { current: false },
      replayEventsRef: { current: [createEvent(0), createEvent(1)] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      pollTimerRef: { current: null },
      setTimeoutFn: vi.fn(),
      intervalMs: 600,
      dispatchReplayEventAtIndex: vi.fn(() => false),
      syncReplayTelemetry: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      stopAllMonitorAudio: vi.fn(),
      logger: { info: vi.fn() },
      replayTick: vi.fn(),
    });

    expect(activeRef.current).toBe(false);
  });

  it("seeks, pauses, resumes and steps replay playback windows", () => {
    const clearTimeoutFn = vi.fn();
    const setTimeoutFn = vi.fn(() => 55);
    const replayTick = vi.fn();
    const dispatchReplayEventAtIndex = vi.fn(() => true);
    const pollTimerRef = { current: 9 as number | null };
    const replayEventsRef = { current: [createEvent(0), createEvent(1), createEvent(2)] };
    const replayIndexRef = { current: 2 };
    const playbackPausedRef = { current: false };
    const activeRef = { current: false };
    const guideTrackFinishedRef = { current: true };
    const setIsPlaybackPaused = vi.fn();
    const seekPlaybackProgress = vi.fn();

    seekReplayPlaybackState({
      progress: 0.8,
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      clearTimeoutFn,
      setTimeoutFn,
      intervalMs: 600,
      replayTick,
    });

    expect(clearTimeoutFn).toHaveBeenCalledWith(9);
    expect(activeRef.current).toBe(true);
    expect(guideTrackFinishedRef.current).toBe(false);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(2, { syncGuideTrack: true });
    expect(setTimeoutFn).toHaveBeenCalledWith(replayTick, 600);

    seekReplayWindowState({
      replayWindowIndex: 1,
      replayEventsRef,
      seekPlaybackProgress,
    });

    expect(seekPlaybackProgress).toHaveBeenCalled();

    pauseReplayPlaybackState({
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      setIsPlaybackPaused,
      clearTimeoutFn,
    });

    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(true);

    replayIndexRef.current = replayEventsRef.current.length;
    resumeReplayPlaybackState({
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      setIsPlaybackPaused,
      clearTimeoutFn,
      setTimeoutFn,
      intervalMs: 600,
      replayTick,
    });

    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(0, { syncGuideTrack: true });
    expect(playbackPausedRef.current).toBe(false);
    expect(activeRef.current).toBe(true);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(false);

    stepReplayPlaybackWindowState({
      direction: -1,
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      setIsPlaybackPaused,
      clearTimeoutFn,
    });

    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);
    expect(guideTrackFinishedRef.current).toBe(false);
    expect(dispatchReplayEventAtIndex).toHaveBeenLastCalledWith(1, { syncGuideTrack: true });
  });

  it("keeps playback paused when resume cannot dispatch the first replay event", () => {
    const playbackPausedRef = { current: true };
    const activeRef = { current: false };
    const setIsPlaybackPaused = vi.fn();

    resumeReplayPlaybackState({
      replayEventsRef: { current: [createEvent(0)] },
      replayIndexRef: { current: 1 },
      pollTimerRef: { current: null },
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef: { current: true },
      dispatchReplayEventAtIndex: vi.fn(() => false),
      setIsPlaybackPaused,
      clearTimeoutFn: vi.fn(),
      setTimeoutFn: vi.fn(),
      intervalMs: 600,
      replayTick: vi.fn(),
    });

    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(true);
  });
});
