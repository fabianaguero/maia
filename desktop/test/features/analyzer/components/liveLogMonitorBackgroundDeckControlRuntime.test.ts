import { describe, expect, it, vi } from "vitest";

import {
  clearBackgroundDeckState,
  buildBackgroundDeckState,
  fadeOutBackgroundDeck,
  prependBackgroundDeckWarning,
  shouldEnsureBackgroundAudio,
} from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckControlRuntime";

function createParam(value = 0.4) {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

describe("liveLogMonitorBackgroundDeckControlRuntime", () => {
  it("fades out an existing deck and tolerates stop races", () => {
    const deck = {
      source: { stop: vi.fn(() => undefined) },
      gain: { gain: createParam(0.5) },
    };

    fadeOutBackgroundDeck(deck, 10.02, 0.9);

    expect(deck.gain.gain.cancelScheduledValues).toHaveBeenCalledWith(10.02);
    expect(deck.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 10.02);
    expect(deck.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.92);
    expect(deck.source.stop).toHaveBeenCalledWith(11);
  });

  it("builds deck state summaries and caps warning history", () => {
    const state = buildBackgroundDeckState({
      source: {} as AudioBufferSourceNode,
      buffer: { duration: 180 } as AudioBuffer,
      gain: {} as GainNode,
      track: { id: "track-2" } as never,
      trackIndex: 1,
      startedAtContextTime: 10.02,
      entrySecond: 8,
      playbackRate: 1.25,
      looping: false,
    });

    expect(state).toMatchObject({
      trackId: "track-2",
      trackIndex: 1,
      bufferDurationSec: 180,
      entrySecond: 8,
      playbackRate: 1.25,
    });
    expect(state.durationSec).toBeCloseTo((180 - 8) / 1.25);
    expect(prependBackgroundDeckWarning("new", ["older-1", "older-2", "older-3"], 3)).toEqual([
      "new",
      "older-1",
      "older-2",
    ]);
  });

  it("clears deck ui state and detects when background audio should start", () => {
    const setBackgroundNowPlayingId = vi.fn();
    const setBackgroundTransitionPlan = vi.fn();

    clearBackgroundDeckState(setBackgroundNowPlayingId, setBackgroundTransitionPlan);

    expect(setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
    expect(shouldEnsureBackgroundAudio(null as never, 2)).toBe(true);
    expect(shouldEnsureBackgroundAudio({ trackId: "track-1" } as never, 2)).toBe(false);
    expect(shouldEnsureBackgroundAudio(null as never, 0)).toBe(false);
  });
});
