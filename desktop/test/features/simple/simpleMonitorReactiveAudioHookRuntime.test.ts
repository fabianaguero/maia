import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  applySimpleMonitorTrackMutationRefState,
  buildSimpleMonitorCueBatchPlaybackState,
  buildSimpleMonitorTestTonePlaybackState,
  resolveSimpleMonitorBackgroundGraphState,
} from "../../../src/features/simple/simpleMonitorReactiveAudioHookRuntime";

class MockAudioParam {
  value = 0;
}

class MockNode {
  connect = vi.fn();
}

class MockGainNode extends MockNode {
  gain = new MockAudioParam();
}

class MockFilterNode extends MockNode {
  type = "lowpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockWaveShaperNode extends MockNode {
  curve: Float32Array | null = null;
  oversample: OverSampleType = "none";
}

function createAudioContext(input?: { state?: AudioContextState; currentTime?: number }) {
  return {
    state: input?.state ?? ("running" as AudioContextState),
    currentTime: input?.currentTime ?? 12,
    destination: {},
    createMediaElementSource: vi.fn(() => new MockNode()),
    createBiquadFilter: vi.fn(() => new MockFilterNode()),
    createWaveShaper: vi.fn(() => new MockWaveShaperNode()),
    createGain: vi.fn(() => new MockGainNode()),
  } as unknown as AudioContext;
}

describe("simpleMonitorReactiveAudioHookRuntime", () => {
  it("builds a test-tone playback state only for running audio contexts", () => {
    expect(
      buildSimpleMonitorTestTonePlaybackState({
        audioContext: createAudioContext({ state: "suspended" }),
        masterVolume: 0.8,
      }),
    ).toBeNull();

    const playbackState = buildSimpleMonitorTestTonePlaybackState({
      audioContext: createAudioContext({ currentTime: 24 }),
      masterVolume: 0.8,
    });

    expect(playbackState?.context.currentTime).toBe(24);
    expect(playbackState?.voicePlans).toHaveLength(3);
    expect(playbackState?.voicePlans[0]?.startAt).toBeGreaterThan(24);
  });

  it("builds cue-batch playback state with the current graph presence", () => {
    const playbackState = buildSimpleMonitorCueBatchPlaybackState({
      audioContext: createAudioContext({ currentTime: 18 }),
      cues: [
        { noteHz: 330, gain: 0.1, durationMs: 120, waveform: "triangle" },
        { noteHz: 440, gain: 0.08, durationMs: 90, waveform: "sine", accent: "anomaly" },
      ],
      masterVolume: 0.65,
      hasBackgroundGraph: true,
    });

    expect(playbackState?.voicePlans).toHaveLength(2);
    expect(playbackState?.voicePlans[0]?.peakGain).toBeLessThan(0.02);
    expect(playbackState?.voicePlans[1]?.frequency).toBe(440);
  });

  it("creates a background graph and forwards warning logging", () => {
    const audioContext = createAudioContext();
    const audio = {} as HTMLAudioElement;
    const warn = vi.fn();

    const graph = resolveSimpleMonitorBackgroundGraphState({
      existing: null,
      context: audioContext,
      audio,
      masterVolume: DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      warn,
    });

    expect(graph).not.toBeNull();
    expect(audioContext.createMediaElementSource).toHaveBeenCalledTimes(1);

    const brokenContext = {
      ...createAudioContext(),
      createMediaElementSource: vi.fn(() => {
        throw new Error("graph failed");
      }),
    } as unknown as AudioContext;

    const brokenGraph = resolveSimpleMonitorBackgroundGraphState({
      existing: null,
      context: brokenContext,
      audio,
      masterVolume: DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      warn,
    });

    expect(brokenGraph).toBeNull();
    expect(warn).toHaveBeenCalledWith("Simple monitor graph setup failed", expect.any(Error));
  });

  it("applies track mutation state from the current background audio ref value", () => {
    const graph = {
      context: { state: "running" } as AudioContext,
    } as never;
    const audio = { playbackRate: 1 } as HTMLAudioElement;
    const applyMonitorReactiveAudioPlan = vi.fn();

    const result = applySimpleMonitorTrackMutationRefState({
      update: {
        lineCount: 12,
        anomalyCount: 2,
        levelCounts: { info: 8, warn: 3, error: 1 },
      },
      graph,
      backgroundAudio: audio,
      currentPressure: 0.22,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      applyMonitorReactiveAudioPlan,
    });

    expect(applyMonitorReactiveAudioPlan).toHaveBeenCalledTimes(1);
    expect(result.nextPressure).toBeCloseTo(0.2084133333333333);
  });
});
