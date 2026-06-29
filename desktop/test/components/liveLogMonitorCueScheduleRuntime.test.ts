import { describe, expect, it, vi } from "vitest";

import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";
import {
  buildSampleCuePlaybackSpec,
  buildTrackSliceCuePlaybackSpec,
  scheduleSampleCue,
  scheduleSynthCue,
  scheduleTrackSliceCue,
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

function createAudioParam() {
  return {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function createGainNode() {
  return {
    gain: createAudioParam(),
    connect: vi.fn(),
  };
}

function createStereoPannerNode() {
  return {
    pan: createAudioParam(),
    connect: vi.fn(),
  };
}

function createOscillatorNode() {
  return {
    type: "sine" as OscillatorType,
    frequency: createAudioParam(),
    detune: createAudioParam(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createBufferSourceNode() {
  return {
    buffer: null as AudioBuffer | null,
    playbackRate: createAudioParam(),
    detune: createAudioParam(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createAudioContext(options: { withStereoPanner?: boolean } = {}) {
  const gainNode = createGainNode();
  const oscillator = createOscillatorNode();
  const source = createBufferSourceNode();
  const stereoPanner = options.withStereoPanner ? createStereoPannerNode() : null;

  const context = {
    createGain: vi.fn(() => gainNode),
    createOscillator: vi.fn(() => oscillator),
    createBufferSource: vi.fn(() => source),
    createStereoPanner: stereoPanner ? vi.fn(() => stereoPanner) : undefined,
  } as unknown as AudioContext;

  return {
    context,
    gainNode,
    oscillator,
    source,
    stereoPanner,
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

  it("schedules synth cues through the stereo panner path", () => {
    const { context, gainNode, oscillator, stereoPanner } = createAudioContext({
      withStereoPanner: true,
    });
    const destination = { connect: vi.fn() } as unknown as AudioNode;
    const cue = createCue({
      accent: "anomaly",
      waveform: "sawtooth",
      pan: -0.35,
      noteHz: 220,
      durationMs: 240,
    });

    scheduleSynthCue(context, cue, 4.5, destination);

    expect(oscillator.type).toBe("sawtooth");
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(220, 4.5);
    expect(oscillator.detune.setValueAtTime).toHaveBeenCalledWith(90, 4.5);
    expect(gainNode.connect).toHaveBeenCalledWith(stereoPanner);
    expect(stereoPanner?.pan.setValueAtTime).toHaveBeenCalledWith(-0.35, 4.5);
    expect(stereoPanner?.connect).toHaveBeenCalledWith(destination);
    expect(oscillator.start).toHaveBeenCalledWith(4.5);
    expect(oscillator.stop).toHaveBeenCalledWith(4.78);
  });

  it("schedules sample cues without a stereo panner fallback", () => {
    const { context, gainNode, source } = createAudioContext();
    const destination = { connect: vi.fn() } as unknown as AudioNode;
    const cue = createCue({
      routeKey: "info",
      accent: "normal",
      durationMs: 80,
      noteHz: 523.26,
      eventIndex: 1,
    });
    const sampleBuffer = { duration: 3.2 } as AudioBuffer;

    scheduleSampleCue(context, cue, sampleBuffer, 2, destination);

    expect(source.buffer).toBe(sampleBuffer);
    expect(source.playbackRate.setValueAtTime).toHaveBeenCalledWith(1.85, 2);
    expect(source.detune.setValueAtTime).not.toHaveBeenCalled();
    expect(gainNode.connect).toHaveBeenCalledWith(destination);
    expect(source.start).toHaveBeenCalledWith(2, expect.any(Number), 0.09);
    const [sampleStopAt] = source.stop.mock.calls[0];
    expect(sampleStopAt).toBeCloseTo(2.12, 5);
  });

  it("schedules track-slice cues from the deck entry point when there is no live cursor", () => {
    const { context, gainNode, source } = createAudioContext();
    const destination = { connect: vi.fn() } as unknown as AudioNode;
    const cue = createCue({
      routeKey: "anomaly",
      accent: "anomaly",
      eventIndex: 2,
      durationMs: 120,
    });
    const deck = {
      buffer: { duration: 9 } as AudioBuffer,
      entrySecond: 1.5,
    };

    scheduleTrackSliceCue(context, cue, deck, 8, destination, null);

    expect(source.buffer).toBe(deck.buffer);
    expect(source.playbackRate.setValueAtTime).toHaveBeenCalledWith(1.08, 8);
    expect(source.detune.setValueAtTime).toHaveBeenCalledWith(80, 8);
    expect(gainNode.connect).toHaveBeenCalledWith(destination);
    const [scheduledStartAt, scheduledOffset, scheduledDuration] = source.start.mock.calls[0];
    const [scheduledStopAt] = source.stop.mock.calls[0];
    expect(scheduledStartAt).toBe(8);
    expect(scheduledOffset).toBeCloseTo(1.67, 5);
    expect(scheduledDuration).toBe(0.12);
    expect(scheduledStopAt).toBeCloseTo(8.15, 5);
  });
});
