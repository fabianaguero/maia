import { describe, expect, it, vi } from "vitest";

import { startBackgroundDeckPlayback } from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckStartRuntime";

function createParam(value = 0.4) {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

describe("liveLogMonitorBackgroundDeckStartRuntime", () => {
  it("starts a new deck, fades the previous one and returns the active deck snapshot", () => {
    const source = {
      buffer: null,
      loop: false,
      playbackRate: createParam(1),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const trackGain = {
      gain: createParam(0.4),
      connect: vi.fn(),
    };
    const context = {
      currentTime: 10,
      createBufferSource: vi.fn(() => source),
      createGain: vi.fn(() => trackGain),
    } as unknown as AudioContext;
    const filter = { id: "filter" } as unknown as BiquadFilterNode;
    const previousDeck = {
      source: { stop: vi.fn() },
      gain: { gain: createParam(0.3) },
    } as never;

    const result = startBackgroundDeckPlayback({
      context,
      filter,
      previousDeck,
      track: { id: "track-2" } as never,
      trackIndex: 1,
      buffer: { duration: 180 } as AudioBuffer,
      startPlan: {
        fadeSeconds: 0.9,
        entrySecond: 8,
        playbackRate: 1.1,
        looping: false,
      },
      targetGain: 0.8,
      transitionPlan: { nextTrackId: "track-2" } as never,
    });

    expect(source.playbackRate.setValueAtTime).toHaveBeenCalledWith(1.1, 10.02);
    expect(trackGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 10.02);
    expect(source.start).toHaveBeenCalledWith(10.02, 8);
    expect(trackGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, 10.92);
    expect(previousDeck.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.92);
    expect(result.nowPlayingId).toBe("track-2");
    expect(result.playheadSecond).toBe(8);
    expect(result.activeTransitionPlan).toEqual({ nextTrackId: "track-2" });
    expect(result.nextDeck).toMatchObject({
      trackId: "track-2",
      trackIndex: 1,
      entrySecond: 8,
      playbackRate: 1.1,
    });
  });
});
