import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { useSimpleMonitorReactiveAudioSlices } from "../../../src/features/simple/useSimpleMonitorReactiveAudioSlices";

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

describe("useSimpleMonitorReactiveAudioSlices", () => {
  const originalWarn = console.warn;

  afterEach(() => {
    console.warn = originalWarn;
  });

  it("builds refs and reactive audio handlers", () => {
    const audioContext = createAudioContext();

    const { result } = renderHook(() =>
      useSimpleMonitorReactiveAudioSlices({
        audioContext,
        isListening: true,
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      }),
    );

    act(() => {
      result.current.playTestTone();
      result.current.playCueBatch([{ noteHz: 330, gain: 0.12 }]);
    });

    expect(result.current.audioContextRef.current).toBe(audioContext);
    expect(audioContext.createOscillator).not.toHaveBeenCalled();
    expect(audioContext.createGain).not.toHaveBeenCalled();
  });
});
