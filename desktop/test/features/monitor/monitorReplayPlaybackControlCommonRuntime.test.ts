import { describe, expect, it, vi } from "vitest";

import {
  buildReplayGuideTrackDispatch,
  clearReplayPlaybackTimerState,
  setReplayPlaybackPausedState,
  setReplayPlaybackRunningState,
} from "../../../src/features/monitor/monitorReplayPlaybackControlCommonRuntime";

describe("monitorReplayPlaybackControlCommonRuntime", () => {
  it("clears timers and wraps replay dispatch with guide-track sync", () => {
    const clearTimeoutFn = vi.fn();
    const pollTimerRef = { current: 12 as number | null };
    clearReplayPlaybackTimerState({ pollTimerRef, clearTimeoutFn });

    expect(clearTimeoutFn).toHaveBeenCalledWith(12);
    expect(pollTimerRef.current).toBeNull();

    const dispatchReplayEventAtIndex = vi.fn(() => true);
    const dispatch = buildReplayGuideTrackDispatch(dispatchReplayEventAtIndex);
    expect(dispatch(3)).toBe(true);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(3, { syncGuideTrack: true });
  });

  it("applies paused and running replay state flags", () => {
    const playbackPausedRef = { current: false };
    const activeRef = { current: true };
    const setIsPlaybackPaused = vi.fn();

    setReplayPlaybackPausedState({
      playbackPausedRef,
      activeRef,
      setIsPlaybackPaused,
    });
    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(true);

    setReplayPlaybackRunningState({
      playbackPausedRef,
      activeRef,
      setIsPlaybackPaused,
    });
    expect(playbackPausedRef.current).toBe(false);
    expect(activeRef.current).toBe(true);
    expect(setIsPlaybackPaused).toHaveBeenCalledWith(false);
  });
});
