import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  pauseReplayPlaybackState,
  resumeReplayPlaybackState,
  seekReplayPlaybackState,
  seekReplayWindowState,
  stepReplayPlaybackWindowState,
} from "../../../src/features/monitor/monitorReplayPlaybackControlRuntime";

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

describe("monitorReplayPlaybackControlRuntime", () => {
  it("seeks replay playback and resumes timer scheduling", () => {
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
  });

  it("pauses, resumes and steps replay playback windows", () => {
    const clearTimeoutFn = vi.fn();
    const setTimeoutFn = vi.fn(() => 55);
    const replayTick = vi.fn();
    const dispatchReplayEventAtIndex = vi.fn(() => true);
    const pollTimerRef = { current: 9 as number | null };
    const replayEventsRef = { current: [createEvent(0), createEvent(1), createEvent(2)] };
    const replayIndexRef = { current: replayEventsRef.current.length };
    const playbackPausedRef = { current: false };
    const activeRef = { current: false };
    const guideTrackFinishedRef = { current: true };
    const setIsPlaybackPaused = vi.fn();
    const seekPlaybackProgress = vi.fn();

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
});
