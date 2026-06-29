import { describe, expect, it } from "vitest";

import {
  buildBeatLooperPulse,
  nextBeatTime,
  resolveBeatClockLiveSync,
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
});
