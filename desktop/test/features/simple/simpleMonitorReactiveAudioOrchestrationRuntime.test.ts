import { describe, expect, it } from "vitest";

import {
  buildSimpleMonitorCueBatchPlan,
  buildSimpleMonitorTestTonePlan,
  hasRunningSimpleMonitorAudioContext,
  shouldReuseSimpleMonitorBackgroundGraph,
} from "../../../src/features/simple/simpleMonitorReactiveAudioOrchestrationRuntime";

describe("simpleMonitorReactiveAudioOrchestrationRuntime", () => {
  it("recognizes running audio contexts", () => {
    expect(hasRunningSimpleMonitorAudioContext(null)).toBe(false);
    expect(
      hasRunningSimpleMonitorAudioContext({ state: "suspended" } as AudioContext),
    ).toBe(false);
    expect(hasRunningSimpleMonitorAudioContext({ state: "running" } as AudioContext)).toBe(true);
  });

  it("builds deterministic test-tone and cue-batch voice plans", () => {
    const tonePlan = buildSimpleMonitorTestTonePlan({
      masterVolume: 0.8,
      now: 10,
    });
    const cuePlan = buildSimpleMonitorCueBatchPlan({
      cues: [
        { noteHz: 330, gain: 0.12, durationMs: 180, waveform: "triangle" },
        { noteHz: 440, gain: 0.08, durationMs: 120, waveform: "sine" },
        { noteHz: 550, gain: 0.2, durationMs: 90, waveform: "square" },
      ],
      masterVolume: 0.8,
      hasBackgroundGraph: false,
      now: 12,
    });

    expect(tonePlan).toHaveLength(3);
    expect(tonePlan[0]).toEqual(
      expect.objectContaining({
        frequency: 164.81,
        type: "sawtooth",
      }),
    );
    expect(tonePlan[2]?.type).toBe("triangle");
    expect(cuePlan).toHaveLength(2);
    expect(cuePlan[0]).toEqual(
      expect.objectContaining({
        frequency: 330,
        type: "triangle",
      }),
    );
    expect(cuePlan[1]?.stopAt).toBeGreaterThan(cuePlan[1]?.releaseAt ?? 0);
  });

  it("decides when the background graph can be reused", () => {
    const context = { state: "running" } as AudioContext;
    const audio = {} as HTMLAudioElement;
    const existing = { context, audio } as never;

    expect(
      shouldReuseSimpleMonitorBackgroundGraph({
        existing,
        context,
        audio,
      }),
    ).toBe(true);
    expect(
      shouldReuseSimpleMonitorBackgroundGraph({
        existing: null,
        context,
        audio,
      }),
    ).toBe(false);
  });
});
