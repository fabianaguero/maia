import { describe, expect, it, vi } from "vitest";

import {
  applyBackgroundDeckStartControllerResult,
  clearBackgroundDeckPresentationState,
  stopBackgroundDeckState,
} from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckActionsRuntime";

function createParam(value = 0.6) {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

describe("liveLogMonitorBackgroundDeckActionsRuntime", () => {
  it("clears background deck presentation state", () => {
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();

    clearBackgroundDeckPresentationState(setBackgroundNowPlayingId, setBackgroundTransitionPlan);

    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
  });

  it("stops and fades the active background deck", () => {
    const deck = {
      source: { stop: vi.fn() },
      gain: { gain: createParam(0.5) },
    };
    const backgroundDeckRef = { current: deck } as never;
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();

    stopBackgroundDeckState({
      context: { currentTime: 12 } as AudioContext,
      deck: deck as never,
      backgroundDeckRef,
      setBackgroundNowPlayingId,
      setBackgroundTransitionPlan,
      fadeOutSeconds: 0.2,
    });

    expect(deck.gain.gain.cancelScheduledValues).toHaveBeenCalledWith(12);
    expect(deck.gain.gain.linearRampToValueAtTime).toHaveBeenCalled();
    expect(deck.source.stop).toHaveBeenCalled();
    expect(backgroundDeckRef.current).toBeNull();
    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
  });

  it("clears state immediately when stopping without active audio resources", () => {
    const backgroundDeckRef = { current: null } as never;
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();

    stopBackgroundDeckState({
      context: null,
      deck: null,
      backgroundDeckRef,
      setBackgroundNowPlayingId,
      setBackgroundTransitionPlan,
      fadeOutSeconds: 0.18,
    });

    expect(backgroundDeckRef.current).toBeNull();
    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
  });

  it("applies started controller results", () => {
    const backgroundDeckRef = { current: null } as never;
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();
    const setBackgroundPlayheadSecond = vi.fn();
    const setRecentWarnings = vi.fn();
    const nextDeck = { trackId: "track-1" };

    applyBackgroundDeckStartControllerResult({
      result: {
        action: "started",
        nextDeck: nextDeck as never,
        nowPlayingId: "track-1",
        activeTransitionPlan: { nextTrackId: "track-2" } as never,
        playheadSecond: 8,
      },
      backgroundDeckRef,
      setBackgroundNowPlayingId,
      setBackgroundTransitionPlan,
      setBackgroundPlayheadSecond,
      setRecentWarnings,
      maxRecentWarnings: 4,
    });

    expect(backgroundDeckRef.current).toBe(nextDeck);
    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith("track-1");
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith({ nextTrackId: "track-2" });
    expect(setBackgroundPlayheadSecond).toHaveBeenCalledWith(8);
    expect(setRecentWarnings).not.toHaveBeenCalled();
  });

  it("applies failed controller results with capped warnings", () => {
    const backgroundDeckRef = { current: { trackId: "old" } } as never;
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();
    const setBackgroundPlayheadSecond = vi.fn();
    const setRecentWarnings = vi.fn();

    applyBackgroundDeckStartControllerResult({
      result: {
        action: "failed",
        warningMessage: "Failed to start guide track: boom",
      },
      backgroundDeckRef,
      setBackgroundNowPlayingId,
      setBackgroundTransitionPlan,
      setBackgroundPlayheadSecond,
      setRecentWarnings,
      maxRecentWarnings: 3,
    });

    expect(backgroundDeckRef.current).toBeNull();
    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
    const updater = setRecentWarnings.mock.calls[0]?.[0];
    expect(updater(["one", "two", "three"])).toEqual([
      "Failed to start guide track: boom",
      "one",
      "two",
    ]);
    expect(setBackgroundPlayheadSecond).not.toHaveBeenCalled();
  });
});
