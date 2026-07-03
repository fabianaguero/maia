import { describe, expect, it, vi } from "vitest";

import { playSimpleMonitorVoicePlans } from "../../../src/features/simple/simpleMonitorReactiveAudioPlaybackRuntime";

class MockAudioParam {
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockNode {
  connect = vi.fn();
}

class MockOscillatorNode extends MockNode {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode extends MockNode {
  gain = new MockAudioParam();
}

describe("simpleMonitorReactiveAudioPlaybackRuntime", () => {
  it("plays every voice plan through oscillator and gain nodes", () => {
    const createOscillator = vi.fn(() => new MockOscillatorNode());
    const createGain = vi.fn(() => new MockGainNode());
    const context = {
      destination: {},
      createOscillator,
      createGain,
    } as unknown as AudioContext;

    playSimpleMonitorVoicePlans(context, [
      {
        frequency: 220,
        type: "triangle",
        startAt: 1,
        peakGain: 0.1,
        releaseAt: 1.2,
        stopAt: 1.24,
      },
      {
        frequency: 330,
        type: "sine",
        startAt: 1.1,
        peakGain: 0.08,
        releaseAt: 1.3,
        stopAt: 1.34,
      },
    ]);

    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(createGain).toHaveBeenCalledTimes(2);
  });
});
