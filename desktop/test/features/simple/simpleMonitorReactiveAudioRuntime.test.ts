import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  applyMonitorReactiveAudioPlan,
  buildSimpleMonitorReactiveAudioHookState,
  type BackgroundTrackGraph,
} from "../../../src/features/simple/simpleMonitorReactiveAudioRuntime";

class MockAudioParam {
  value = 1;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
}

function createGraph(): BackgroundTrackGraph {
  return {
    context: {
      currentTime: 10,
    } as AudioContext,
    audio: {} as HTMLAudioElement,
    source: {} as MediaElementAudioSourceNode,
    filter: {
      frequency: new MockAudioParam(),
      Q: new MockAudioParam(),
    } as unknown as BiquadFilterNode,
    dryGain: {
      gain: new MockAudioParam(),
    } as unknown as GainNode,
    driveNode: {
      curve: null,
    } as unknown as WaveShaperNode,
    driveWetGain: {
      gain: new MockAudioParam(),
    } as unknown as GainNode,
    outputGain: {
      gain: new MockAudioParam(),
    } as unknown as GainNode,
    deckGain: {
      gain: new MockAudioParam(),
    } as unknown as GainNode,
  };
}

describe("simpleMonitorReactiveAudioRuntime", () => {
  it("applies neutral monitor mutations without burst gating", () => {
    const graph = createGraph();
    const audio = { playbackRate: 1 } as HTMLAudioElement;

    applyMonitorReactiveAudioPlan({
      graph,
      audio,
      masterVolume: 0.8,
      adjustedPlan: {
        mode: "neutral",
        nextPressure: 0.1,
        burstFactor: 0,
        filterHz: 16000,
        filterQ: 1.2,
        outputGain: 0.82,
        dryGain: 1,
        driveWet: 0.0001,
        deckGain: 1,
        driveCurveAmount: 1.08,
        playbackRate: 1,
        sustainedBurst: false,
        recoverAtOffsetSec: 0.2,
        transitionSec: 0.18,
        gateFloor: null,
      },
    });

    expect(graph.filter.frequency.cancelScheduledValues).toHaveBeenCalled();
    expect(graph.filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(16000, 10.2);
    expect(graph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.82, 10.18);
    expect(graph.driveNode.curve).not.toBeNull();
    expect(audio.playbackRate).toBe(1);
  });

  it("applies alert monitor mutations with recovery ramps and optional gate pulses", () => {
    const graph = createGraph();
    const audio = { playbackRate: 1 } as HTMLAudioElement;

    applyMonitorReactiveAudioPlan({
      graph,
      audio,
      masterVolume: 0.8,
      adjustedPlan: {
        mode: "alert",
        nextPressure: 0.8,
        burstFactor: 0.4,
        filterHz: 9000,
        filterQ: 1.4,
        outputGain: 0.88,
        dryGain: 0.95,
        driveWet: 0.04,
        deckGain: 0.98,
        driveCurveAmount: 1.3,
        playbackRate: 1,
        sustainedBurst: false,
        recoverAtOffsetSec: 2.5,
        transitionSec: 0.26,
        gateFloor: 0.96,
      },
    });

    expect(graph.filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(9000, 10.32);
    expect(graph.filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(18000, 12.5);
    expect(graph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.88, 10.26);
    expect(graph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, 12.5);
    expect(graph.deckGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.96, 10.3);
    expect(graph.driveNode.curve).not.toBeNull();
  });

  it("uses sustained alert timings without gate pulses when gateFloor is null", () => {
    const graph = createGraph();
    const audio = { playbackRate: 1 } as HTMLAudioElement;

    applyMonitorReactiveAudioPlan({
      graph,
      audio,
      masterVolume: 0.7,
      adjustedPlan: {
        mode: "alert",
        nextPressure: 0.95,
        burstFactor: 0.9,
        filterHz: 7600,
        filterQ: 1.8,
        outputGain: 0.92,
        dryGain: 0.9,
        driveWet: 0.08,
        deckGain: 0.94,
        driveCurveAmount: 1.5,
        playbackRate: 0.98,
        sustainedBurst: true,
        recoverAtOffsetSec: 3,
        transitionSec: 0.3,
        gateFloor: null,
      },
    });

    expect(graph.filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(7600, 10.5);
    expect(graph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.92, 10.38);
    expect(graph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.7, 13);
    expect(graph.deckGain.gain.linearRampToValueAtTime).not.toHaveBeenCalledWith(
      expect.any(Number),
      10.3,
    );
    expect(audio.playbackRate).toBe(0.98);
  });

  it("builds the reactive audio hook state snapshot", () => {
    const backgroundGraphRef = { current: null };
    const audioContextRef = { current: null };
    const deckControlsRef = { current: DEFAULT_MONITOR_DECK_CONTROLS };
    const ensureBackgroundGraph = vi.fn();
    const applyTrackMutation = vi.fn();
    const playTestTone = vi.fn();
    const playCueBatch = vi.fn();

    const state = buildSimpleMonitorReactiveAudioHookState({
      backgroundGraphRef,
      audioContextRef,
      deckControlsRef,
      ensureBackgroundGraph,
      applyTrackMutation,
      playTestTone,
      playCueBatch,
    });

    expect(state.backgroundGraphRef).toBe(backgroundGraphRef);
    expect(state.deckControlsRef).toBe(deckControlsRef);
    expect(state.ensureBackgroundGraph).toBe(ensureBackgroundGraph);
    expect(state.playCueBatch).toBe(playCueBatch);
  });
});
