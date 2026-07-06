import { describe, expect, it, vi } from "vitest";

import {
  buildBeatLooperPulse,
  nextBeatTime,
  resolveBeatClockLiveSync,
  startBeatLooper,
  stopBeatLooper,
} from "../../src/features/analyzer/components/liveLogMonitorBeatRuntime";

describe("liveLogMonitorBeatRuntime", () => {
  it("returns the next subdivision boundary after lookahead", () => {
    const at = nextBeatTime(10.12, 10, 120, 4, 0.1);

    expect(at).toBeCloseTo(10.5, 4);
  });

  it("supports denser subdivisions", () => {
    const at = nextBeatTime(4.01, 4, 128, 16, 0.05);
    const sixteenth = 60 / 128 / 4;

    expect(at).toBeCloseTo(4 + Math.ceil(0.06 / sixteenth) * sixteenth, 4);
  });

  it("clamps subdivisions below one beat to a safe minimum", () => {
    const at = nextBeatTime(1.1, 1, 120, 0, 0.1);

    expect(at).toBeCloseTo(1.5, 4);
  });

  it("uses a stronger pulse on downbeats", () => {
    const downbeat = buildBeatLooperPulse(0);
    const offbeat = buildBeatLooperPulse(1);

    expect(downbeat.noteHz).toBeLessThan(offbeat.noteHz);
    expect(downbeat.peakGain).toBeGreaterThan(offbeat.peakGain);
    expect(downbeat.durationSeconds).toBeGreaterThan(offbeat.durationSeconds);
  });

  it("seeds the beat clock from live bpm when beat grid is enabled", () => {
    const plan = resolveBeatClockLiveSync({
      currentClock: null,
      liveBpm: 126,
      useBeatGrid: true,
      audioCurrentTime: 18.2,
    });

    expect(plan.changed).toBe(true);
    expect(plan.nextClock).toEqual({ originTime: 18.2, bpm: 126 });
    expect(plan.nextDisplayBpm).toBe(126);
  });

  it("ignores minor drift and only updates on meaningful bpm divergence", () => {
    const unchanged = resolveBeatClockLiveSync({
      currentClock: { originTime: 4, bpm: 126 },
      liveBpm: 132,
      useBeatGrid: true,
      audioCurrentTime: 10,
    });
    const changed = resolveBeatClockLiveSync({
      currentClock: { originTime: 4, bpm: 126 },
      liveBpm: 150,
      useBeatGrid: true,
      audioCurrentTime: 10,
    });

    expect(unchanged.changed).toBe(false);
    expect(changed.changed).toBe(true);
    expect(changed.nextClock?.bpm).toBe(150);
  });

  it("returns unchanged beat state when beat-grid sync is disabled or incomplete", () => {
    const currentClock = { originTime: 4, bpm: 126 };

    expect(
      resolveBeatClockLiveSync({
        currentClock,
        liveBpm: 126,
        useBeatGrid: false,
        audioCurrentTime: 12,
      }),
    ).toEqual({
      nextClock: currentClock,
      nextDisplayBpm: null,
      changed: false,
    });

    expect(
      resolveBeatClockLiveSync({
        currentClock: null,
        liveBpm: 126,
        useBeatGrid: true,
        audioCurrentTime: null,
      }),
    ).toEqual({
      nextClock: null,
      nextDisplayBpm: null,
      changed: false,
    });

    expect(
      resolveBeatClockLiveSync({
        currentClock,
        liveBpm: 0,
        useBeatGrid: true,
        audioCurrentTime: 12,
      }),
    ).toEqual({
      nextClock: currentClock,
      nextDisplayBpm: null,
      changed: false,
    });
  });

  it("starts and stops the beat looper safely", () => {
    vi.useFakeTimers();

    const oscillator = {
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const context = {
      currentTime: 10,
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gainNode),
    } as unknown as AudioContext;
    const stateRef = {
      current: null,
    } as { current: { cancelled: boolean } | null };
    const destination = { id: "dest" } as unknown as AudioNode;

    startBeatLooper(context, 120, 4, stateRef as never, destination);

    expect(stateRef.current).toEqual({ cancelled: false });
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalled();
    expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    stopBeatLooper(stateRef as never);
    expect(stateRef.current).toBeNull();

    vi.advanceTimersByTime(2000);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    stopBeatLooper(stateRef as never);
    vi.useRealTimers();
  });
});
