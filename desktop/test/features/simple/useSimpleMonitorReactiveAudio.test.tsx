import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { useSimpleMonitorReactiveAudio } from "../../../src/features/simple/useSimpleMonitorReactiveAudio";

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
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
    currentTime: 10,
    destination: {},
    createOscillator: vi.fn(() => new MockOscillatorNode()),
    createGain: vi.fn(() => new MockGainNode()),
    createMediaElementSource: vi.fn(() => new MockNode()),
    createBiquadFilter: vi.fn(() => new MockFilterNode()),
    createWaveShaper: vi.fn(() => new MockWaveShaperNode()),
  } as unknown as AudioContext;
}

describe("useSimpleMonitorReactiveAudio", () => {
  const originalWarn = console.warn;

  afterEach(() => {
    console.warn = originalWarn;
  });

  it("plays a test tone and cue batches when the audio context is running", () => {
    const audioContext = createAudioContext();

    const { result } = renderHook(() =>
      useSimpleMonitorReactiveAudio({
        audioContext,
        isListening: true,
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      }),
    );

    act(() => {
      result.current.playTestTone();
      result.current.playCueBatch([
        {
          noteHz: 330,
          gain: 0.12,
          durationMs: 180,
          waveform: "triangle",
        },
        {
          noteHz: 440,
          gain: 0.1,
          durationMs: 120,
          waveform: "sine",
        },
      ]);
    });

    expect(audioContext.createOscillator).toHaveBeenCalled();
    expect(audioContext.createGain).toHaveBeenCalled();
  });

  it("skips tone and cue playback when the audio context is not running", () => {
    const audioContext = {
      ...createAudioContext(),
      state: "suspended" as AudioContextState,
    };

    const { result } = renderHook(() =>
      useSimpleMonitorReactiveAudio({
        audioContext,
        isListening: true,
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      }),
    );

    act(() => {
      result.current.playTestTone();
      result.current.playCueBatch([{ noteHz: 330, gain: 0.12 }]);
    });

    expect(audioContext.createOscillator).not.toHaveBeenCalled();
    expect(audioContext.createGain).not.toHaveBeenCalled();
  });

  it("creates and reuses the background graph, then applies track mutations", () => {
    const audioContext = createAudioContext();
    const audioElement = { playbackRate: 1 } as HTMLAudioElement;

    const { result } = renderHook(() =>
      useSimpleMonitorReactiveAudio({
        audioContext,
        isListening: true,
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      }),
    );

    let graph: ReturnType<typeof result.current.ensureBackgroundGraph>;
    act(() => {
      graph = result.current.ensureBackgroundGraph(audioElement, audioContext);
    });

    expect(graph).not.toBeNull();
    expect(audioContext.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(audioContext.createBiquadFilter).toHaveBeenCalledTimes(1);
    expect(audioContext.createWaveShaper).toHaveBeenCalledTimes(1);

    let sameGraph: ReturnType<typeof result.current.ensureBackgroundGraph>;
    act(() => {
      sameGraph = result.current.ensureBackgroundGraph(audioElement, audioContext);
    });
    expect(sameGraph).toBe(graph);
    expect(audioContext.createMediaElementSource).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.applyTrackMutation(
        {
          lineCount: 12,
          anomalyCount: 2,
          levelCounts: { info: 8, warn: 3, error: 1 },
          anomalyMarkers: [
            { eventIndex: 1, level: "warn", component: "svc", excerpt: "slow" },
            { eventIndex: 2, level: "error", component: "svc", excerpt: "boom" },
          ],
        },
        { current: audioElement },
      );
    });

    const typedGraph = graph!;
    expect(typedGraph.filter.frequency.cancelScheduledValues).toHaveBeenCalled();
    expect(typedGraph.outputGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
    expect(typedGraph.driveWetGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
    expect(typedGraph.driveNode.curve).not.toBeNull();
  });

  it("returns null when graph setup fails and ignores mutations without a running graph", () => {
    console.warn = vi.fn();
    const audioContext = {
      ...createAudioContext(),
      createMediaElementSource: vi.fn(() => {
        throw new Error("media source failed");
      }),
    } as unknown as AudioContext;
    const audioElement = { playbackRate: 1 } as HTMLAudioElement;

    const { result } = renderHook(() =>
      useSimpleMonitorReactiveAudio({
        audioContext,
        isListening: true,
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      }),
    );

    let graph: ReturnType<typeof result.current.ensureBackgroundGraph>;
    act(() => {
      graph = result.current.ensureBackgroundGraph(audioElement, audioContext);
      result.current.applyTrackMutation(
        {
          lineCount: 4,
          anomalyCount: 1,
          levelCounts: { warn: 1 },
          anomalyMarkers: [{ eventIndex: 1, level: "warn", component: "svc", excerpt: "slow" }],
        },
        { current: null },
      );
    });

    expect(graph).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Simple monitor graph setup failed",
      expect.any(Error),
    );
  });
});
