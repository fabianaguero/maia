import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  applySimpleMonitorTrackMutationState,
  ensureSimpleMonitorBackgroundGraphState,
} from "../../../src/features/simple/simpleMonitorReactiveAudioControllerRuntime";

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

function createAudioContext() {
  return {
    state: "running" as AudioContextState,
    destination: {},
    createMediaElementSource: vi.fn(() => new MockNode()),
    createBiquadFilter: vi.fn(() => new MockFilterNode()),
    createWaveShaper: vi.fn(() => new MockWaveShaperNode()),
    createGain: vi.fn(() => new MockGainNode()),
  } as unknown as AudioContext;
}

describe("simpleMonitorReactiveAudioControllerRuntime", () => {
  it("creates and reuses a background graph", () => {
    const context = createAudioContext();
    const audio = { playbackRate: 1 } as HTMLAudioElement;
    const logger = { warn: vi.fn() };

    const graph = ensureSimpleMonitorBackgroundGraphState({
      existing: null,
      context,
      audio,
      masterVolume: DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      logger,
    });

    expect(graph).not.toBeNull();
    expect(context.createMediaElementSource).toHaveBeenCalledTimes(1);

    const reused = ensureSimpleMonitorBackgroundGraphState({
      existing: graph,
      context,
      audio,
      masterVolume: DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      logger,
    });

    expect(reused).toBe(graph);
    expect(context.createMediaElementSource).toHaveBeenCalledTimes(1);
  });

  it("returns the same pressure when there is no running graph", () => {
    const next = applySimpleMonitorTrackMutationState({
      update: { lineCount: 4, anomalyCount: 1 },
      graph: null,
      audio: null,
      currentPressure: 0.42,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      buildMonitorTrackMutationPlan: vi.fn(),
      buildAdjustedMonitorTrackMutationPlan: vi.fn(),
      applyMonitorReactiveAudioPlan: vi.fn(),
    });

    expect(next).toEqual({ nextPressure: 0.42 });
  });

  it("applies the adjusted mutation plan and returns the next pressure", () => {
    const graph = {
      context: { state: "running" } as AudioContext,
    } as never;
    const audio = { playbackRate: 1 } as HTMLAudioElement;
    const plan = { mode: "burst" } as never;
    const adjustedPlan = { nextPressure: 0.73 } as never;
    const buildMonitorTrackMutationPlan = vi.fn(() => plan);
    const buildAdjustedMonitorTrackMutationPlan = vi.fn(() => adjustedPlan);
    const applyMonitorReactiveAudioPlan = vi.fn();

    const next = applySimpleMonitorTrackMutationState({
      update: { lineCount: 12, anomalyCount: 2 },
      graph,
      audio,
      currentPressure: 0.18,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      buildMonitorTrackMutationPlan,
      buildAdjustedMonitorTrackMutationPlan,
      applyMonitorReactiveAudioPlan,
    });

    expect(buildMonitorTrackMutationPlan).toHaveBeenCalledWith(
      { lineCount: 12, anomalyCount: 2 },
      0.18,
    );
    expect(buildAdjustedMonitorTrackMutationPlan).toHaveBeenCalledWith({
      plan,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
    });
    expect(applyMonitorReactiveAudioPlan).toHaveBeenCalledWith({
      graph,
      adjustedPlan,
      masterVolume: DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      audio,
    });
    expect(next).toEqual({ nextPressure: 0.73 });
  });
});
