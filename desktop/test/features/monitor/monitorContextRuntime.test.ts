import { describe, expect, it, vi } from "vitest";

import {
  createSyntheticReplayEvent,
  emitMonitorAudioProbe,
  ensureMonitorAudioContext,
  registerActiveAudioElement,
  stopAllMonitorAudio,
  stopCrossfadeEngine,
  unregisterActiveAudioElement,
} from "../../../src/features/monitor/monitorContextRuntime";
import type { CrossfadeHandle } from "../../../src/features/monitor/monitorAudioRuntimeTypes";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";

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
    sonificationCues: [
      {
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
      },
    ],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
  };
}

describe("monitorContextRuntime", () => {
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

    const throwingSegmentRef = {
      current: {
        gainNode,
        source: {
          stop: vi.fn(() => {
            throw new Error("stop boom");
          }),
        } as unknown as AudioBufferSourceNode,
        scheduledEndTime: 2,
      } as CrossfadeHandle,
    };
    const throwingSourcesRef = {
      current: [
        {
          stop: vi.fn(() => {
            throw new Error("tail boom");
          }),
        } as unknown as AudioBufferSourceNode,
      ],
    };

    expect(() =>
      stopCrossfadeEngine(throwingSegmentRef, audioContextRef, throwingSourcesRef),
    ).not.toThrow();
    expect(throwingSegmentRef.current).toBeNull();
    expect(throwingSourcesRef.current).toEqual([]);

    const noContextSegmentRef = { current: null as CrossfadeHandle | null };
    const noContextSourcesRef = { current: [trailingSource] };
    stopCrossfadeEngine(noContextSegmentRef, { current: null }, noContextSourcesRef);
    expect(noContextSourcesRef.current).toEqual([trailingSource]);

    const pausedContextSegmentRef = {
      current: {
        gainNode,
        source: currentSource,
        scheduledEndTime: 2,
      } as CrossfadeHandle,
    };
    const pausedSourcesRef = { current: [] as AudioBufferSourceNode[] };
    stopCrossfadeEngine(
      pausedContextSegmentRef,
      { current: { state: "suspended", currentTime: 4 } as AudioContext },
      pausedSourcesRef,
    );
    expect(pausedContextSegmentRef.current).toBeNull();
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

    const existingRunningContext = {
      state: "running",
      sampleRate: 48000,
      currentTime: 2,
      destination: {},
      resume: vi.fn(async () => undefined),
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gainNode),
    } as unknown as AudioContext;

    const reused = await ensureMonitorAudioContext({
      audioContextRef: { current: existingRunningContext },
      setAudioContext,
      logger,
    });

    expect(reused).toBe(existingRunningContext);
    expect(setAudioContext).toHaveBeenCalledTimes(1);
    expect(
      (existingRunningContext as { resume: ReturnType<typeof vi.fn> }).resume,
    ).not.toHaveBeenCalled();

    emitMonitorAudioProbe({
      context: { state: "suspended" } as AudioContext,
      frequency: 440,
      attackGain: 0.15,
      releaseTimeSec: 0.3,
    });

    expect(createdContext.createOscillator).toHaveBeenCalledTimes(1);
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
