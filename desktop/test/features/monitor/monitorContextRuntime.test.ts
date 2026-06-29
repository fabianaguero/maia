import { describe, expect, it, vi } from "vitest";

import {
  createSyntheticReplayEvent,
  emitMonitorAudioProbe,
  ensureMonitorAudioContext,
  quantizeMonitorFrequency,
  registerActiveAudioElement,
  renderSynthFallback,
  sliceGuideTrackBar,
  stopAllMonitorAudio,
  stopCrossfadeEngine,
  unregisterActiveAudioElement,
  type CrossfadeHandle,
  type GuideTrackPCM,
} from "../../../src/features/monitor/monitorContextRuntime";
import type { LiveLogCue, LiveLogStreamUpdate } from "../../../src/types/monitor";

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

function createUpdate(): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.72,
    dominantLevel: "warn",
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1 },
    anomalyMarkers: [{ eventIndex: 1, level: "error", component: "payments", excerpt: "500" }],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [createCue()],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
  };
}

describe("monitorContextRuntime", () => {
  it("quantizes monitor frequencies to the nearest scale tone", () => {
    expect(quantizeMonitorFrequency(438)).toBe(440);
    expect(quantizeMonitorFrequency(350)).toBe(349.23);
  });

  it("renders synth fallback audio and slices guide track bars", () => {
    const blob = renderSynthFallback([createCue()], 0.5, 0.6, 126);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size ?? 0).toBeGreaterThan(44);

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
  });

  it("stops registered audio elements and clears crossfade sources", () => {
    const audio = {
      pause: vi.fn(),
      currentTime: 12,
      src: "blob:test",
    } as unknown as HTMLAudioElement;

    registerActiveAudioElement(audio);
    stopAllMonitorAudio();
    unregisterActiveAudioElement(audio);

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(audio.src).toBe("");

    const gainNode = {
      gain: {
        value: 0.5,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    } as unknown as GainNode;
    const currentSource = {
      stop: vi.fn(),
    } as unknown as AudioBufferSourceNode;
    const trailingSource = {
      stop: vi.fn(),
    } as unknown as AudioBufferSourceNode;
    const currentSegmentRef = {
      current: {
        gainNode,
        source: currentSource,
        scheduledEndTime: 2,
      } as CrossfadeHandle,
    };
    const audioContextRef = {
      current: {
        state: "running",
        currentTime: 1,
      } as AudioContext,
    };
    const activeSourcesRef = {
      current: [trailingSource],
    };

    stopCrossfadeEngine(currentSegmentRef, audioContextRef, activeSourcesRef);

    expect(currentSegmentRef.current).toBeNull();
    expect(currentSource.stop).toHaveBeenCalled();
    expect(trailingSource.stop).toHaveBeenCalledWith(1);
    expect(activeSourcesRef.current).toEqual([]);
  });

  it("creates or resumes audio contexts and emits probe tones", async () => {
    const resume = vi.fn(async () => undefined);
    const oscillator = {
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const createdContext = {
      state: "suspended",
      currentTime: 1,
      destination: {},
      sampleRate: 44100,
      resume,
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gainNode),
    } as unknown as AudioContext;

    const setAudioContext = vi.fn();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
    };

    const context = await ensureMonitorAudioContext({
      audioContextRef: { current: null },
      setAudioContext,
      logger,
      reason: "manual-resume",
      createAudioContext: () => createdContext,
    });

    expect(context).toBe(createdContext);
    expect(setAudioContext).toHaveBeenCalledWith(createdContext);
    expect(resume).toHaveBeenCalledTimes(1);

    (createdContext as { state: AudioContextState }).state = "running";
    emitMonitorAudioProbe({
      context: createdContext,
      frequency: 440,
      attackGain: 0.15,
      releaseTimeSec: 0.3,
    });

    expect(createdContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(createdContext.createGain).toHaveBeenCalledTimes(1);
    expect(oscillator.start).toHaveBeenCalledWith(1);
    expect(oscillator.stop).toHaveBeenCalledWith(1.3);
  });

  it("creates synthetic replay events from live updates", () => {
    const event = createSyntheticReplayEvent("persisted-1", 3, createUpdate());

    expect(event.id).toBe(-4);
    expect(event.sessionId).toBe("persisted-1");
    expect(event.pollIndex).toBe(3);
    expect(JSON.parse(event.sonificationCuesJson)).toHaveLength(1);
    expect(JSON.parse(event.anomalyMarkersJson)).toHaveLength(1);
  });
});
