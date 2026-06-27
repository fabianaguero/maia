import { describe, expect, it } from "vitest";

import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";
import {
  buildSampleCuePlaybackSpec,
  buildTrackSliceCuePlaybackSpec,
} from "../../src/features/analyzer/components/liveLogMonitorCueScheduleRuntime";

function createCue(overrides: Partial<RoutedLiveCue> = {}): RoutedLiveCue {
  return {
    id: "cue-1",
    timestamp: Date.now(),
    noteHz: 330,
    durationMs: 180,
    gain: 0.45,
    pan: 0.1,
    waveform: "triangle",
    accent: "normal",
    routeKey: "warn",
    traceId: null,
    sourceLabel: "services",
    eventIndex: 3,
    voiceName: "warn",
    trackId: "track-1",
    componentName: null,
    sourceLine: "WARN hello",
    markerId: null,
    ...overrides,
  };
}

describe("liveLogMonitorCueScheduleRuntime", () => {
  it("derives bounded sample playback specs from cue density and route", () => {
    const spec = buildSampleCuePlaybackSpec(createCue({ routeKey: "error", eventIndex: 4 }), 12);

    expect(spec.offsetSeconds).toBeGreaterThan(4);
    expect(spec.offsetSeconds).toBeLessThan(11);
    expect(spec.durationSeconds).toBeGreaterThanOrEqual(0.09);
    expect(spec.playbackRate).toBeGreaterThan(1);
    expect(spec.detuneCents).toBe(0);
  });

  it("marks anomaly sample cues with detune", () => {
    const spec = buildSampleCuePlaybackSpec(createCue({ accent: "anomaly" }), 8);

    expect(spec.detuneCents).toBe(120);
  });

  it("derives track-slice playback around the current anchor with anomaly emphasis", () => {
    const spec = buildTrackSliceCuePlaybackSpec(
      createCue({ routeKey: "anomaly", accent: "anomaly", eventIndex: 2 }),
      30,
      12.5,
    );

    expect(spec.offsetSeconds).toBeGreaterThanOrEqual(12.6);
    expect(spec.offsetSeconds).toBeLessThan(13);
    expect(spec.durationSeconds).toBeGreaterThanOrEqual(0.08);
    expect(spec.playbackRate).toBe(1.08);
    expect(spec.detuneCents).toBe(80);
  });

  it("clamps track-slice offsets near deck edges", () => {
    const spec = buildTrackSliceCuePlaybackSpec(createCue({ routeKey: "info" }), 0.2, 0.01);

    expect(spec.offsetSeconds).toBeGreaterThanOrEqual(0);
    expect(spec.offsetSeconds).toBeLessThanOrEqual(0.15);
    expect(spec.durationSeconds).toBeGreaterThanOrEqual(0.08);
  });
});
