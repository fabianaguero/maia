import { describe, expect, it } from "vitest";

import {
  quantizeMonitorFrequency,
  renderSynthFallback,
  sliceGuideTrackBar,
} from "../../../src/features/monitor/monitorAudioSynthesisRuntime";
import type { GuideTrackPCM } from "../../../src/features/monitor/monitorAudioRuntimeTypes";
import type { LiveLogCue } from "../../../src/types/monitor";

function createCue(overrides: Partial<LiveLogCue> = {}): LiveLogCue {
  return {
    id: "cue-1",
    eventIndex: 1,
    level: "warn",
    component: "queue",
    excerpt: "queue depth rising",
    noteHz: 440,
    durationMs: 120,
    gain: 0.5,
    waveform: "triangle",
    accent: "warn",
    ...overrides,
  };
}

describe("monitorAudioSynthesisRuntime", () => {
  it("quantizes monitor frequencies to the nearest scale tone", () => {
    expect(quantizeMonitorFrequency(438)).toBe(440);
    expect(quantizeMonitorFrequency(350)).toBe(349.23);
  });

  it("renders synth fallback audio and slices guide track bars", () => {
    const blob = renderSynthFallback([createCue()], 0.5, 0.6, 126);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size ?? 0).toBeGreaterThan(44);
    expect(renderSynthFallback([], 0.5, 0.6, 126)).toBeNull();
    expect(
      renderSynthFallback(
        [createCue({ noteHz: 261.63 }), createCue({ id: "cue-2", noteHz: 523.25, gain: 0.8 })],
        0.5,
        0.6,
        126,
      ),
    ).toBeInstanceOf(Blob);

    const pcm: GuideTrackPCM = {
      samples: new Float32Array(44100).fill(0.25),
      sampleRate: 44100,
      durationSec: 1,
    };
    const cursorRef = { current: 0 };
    const sliced = sliceGuideTrackBar(pcm, cursorRef, [createCue()], 0.25, 126, 0.7);

    expect(sliced).toBeInstanceOf(Blob);
    expect(cursorRef.current).toBeGreaterThan(0);
    cursorRef.current = pcm.samples.length;
    expect(sliceGuideTrackBar(pcm, cursorRef, [createCue()], 0.25, 126, 0.7)).toBeNull();
    expect(sliced?.size ?? 0).toBeGreaterThan(44);

    const anomalyHeavy = sliceGuideTrackBar(
      pcm,
      { current: 0 },
      [
        createCue({ accent: "anomaly", gain: 0.9 }),
        createCue({ id: "cue-2", accent: "anomaly", gain: 0.8, noteHz: 523.25 }),
      ],
      0.25,
      0,
      0.9,
    );
    expect(anomalyHeavy).toBeInstanceOf(Blob);

    const tailCursorRef = { current: pcm.samples.length - 100 };
    const tailSlice = sliceGuideTrackBar(pcm, tailCursorRef, [createCue()], 0.25, 126, 0.7);
    expect(tailSlice).toBeInstanceOf(Blob);
    expect(tailCursorRef.current).toBe(pcm.samples.length);
  });
});
