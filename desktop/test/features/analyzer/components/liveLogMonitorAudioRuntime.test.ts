import { describe, expect, it, vi } from "vitest";

import type { LiveLogStreamUpdate } from "../../../../src/types/library";
import {
  clamp01,
  createDriveCurve,
  createManagedBlobAudioRegistry,
  forceBackgroundMutationProfile,
  playManagedWavBlobState,
  resolveBackgroundMutationProfile,
  resolveLiveMutationState,
  resolveManagedAudioSourceState,
  setBlobAudioVolumeState,
  stopManagedBlobAudioState,
} from "../../../../src/features/analyzer/components/liveLogMonitorAudioRuntime";

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/live.log",
    fromOffset: 0,
    toOffset: 120,
    hasData: true,
    summary: "window",
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: "warn",
    lineCount: 10,
    anomalyCount: 2,
    levelCounts: { warn: 3, error: 1, info: 6 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    ...overrides,
  };
}

describe("liveLogMonitorAudioRuntime", () => {
  it("builds drive curves and clamps values", () => {
    const curve = createDriveCurve(0);
    expect(curve).toHaveLength(2048);
    expect(curve[0]).toBeLessThan(0);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });

  it("derives and forces background mutation profiles", () => {
    const mutation = resolveBackgroundMutationProfile(createUpdate(), 0.8, 300, 12000, {
      backgroundDucking: 0.4,
      filterSweepMultiplier: 1.5,
      anomalyBoostMultiplier: 1.2,
      transitionTightness: 0.9,
    });

    expect(mutation.driveWet).toBeGreaterThan(0);
    expect(resolveLiveMutationState(mutation)).toBe("warning");
    expect(
      forceBackgroundMutationProfile("critical", {
        backgroundGain: 0.8,
        filterBaseHz: 300,
        filterCeilingHz: 12000,
      }).gatePulses,
    ).toBe(4);
    expect(
      forceBackgroundMutationProfile("warning", {
        backgroundGain: 0.1,
        filterBaseHz: 300,
        filterCeilingHz: 400,
      }),
    ).toMatchObject({
      filterHz: 230,
      busGain: 0.17,
      gatePulses: 1,
    });
    expect(
      forceBackgroundMutationProfile("normal", {
        backgroundGain: 0.8,
        filterBaseHz: 300,
        filterCeilingHz: 30000,
      }),
    ).toMatchObject({
      filterHz: 22000,
      gatePulses: 0,
      driveWet: 0,
    });
    expect(
      resolveLiveMutationState({
        ...mutation,
        driveWet: 0.05,
        gatePulses: 0,
      }),
    ).toBe("normal");
  });

  it("uses uppercase level counts, line-count fallback and critical pressure thresholds", () => {
    const mutation = resolveBackgroundMutationProfile(
      createUpdate({
        lineCount: 0,
        anomalyCount: 9,
        levelCounts: { WARN: 5, ERROR: 4 },
      }),
      0.3,
      120,
      1600,
      {
        backgroundDucking: 0.9,
        filterSweepMultiplier: 0.5,
        anomalyBoostMultiplier: 3,
        transitionTightness: 0.2,
      },
    );

    expect(mutation.filterHz).toBeGreaterThanOrEqual(180);
    expect(mutation.busGain).toBeGreaterThanOrEqual(0.14);
    expect(mutation.gateDepth).toBeLessThanOrEqual(0.68);
    expect(mutation.gatePulses).toBe(3);
    expect(resolveLiveMutationState(mutation)).toBe("critical");
  });

  it("manages blob audio volume and stop state", () => {
    const registry = createManagedBlobAudioRegistry();
    const first = {
      volume: 0,
      currentTime: 5,
      pause: vi.fn(),
      play: vi.fn(async () => undefined),
      addEventListener: vi.fn(),
    };
    const second = {
      volume: 0,
      currentTime: 3,
      pause: vi.fn(),
      play: vi.fn(async () => undefined),
      addEventListener: vi.fn(),
    };
    registry.add(first);
    registry.add(second);

    setBlobAudioVolumeState(registry, 0.7);
    expect(first.volume).toBe(0.7);
    expect(second.volume).toBe(0.7);

    setBlobAudioVolumeState(registry, 2);
    expect(first.volume).toBe(1);

    setBlobAudioVolumeState(registry, -1);
    expect(second.volume).toBe(0);

    stopManagedBlobAudioState(registry);
    expect(first.pause).toHaveBeenCalled();
    expect(second.currentTime).toBe(0);
    expect(registry.size).toBe(0);
  });

  it("plays managed wav blobs and cleans up on end/failure", async () => {
    const registry = createManagedBlobAudioRegistry();
    let ended: (() => void) | null = null;
    const audio = {
      volume: 0,
      currentTime: 0,
      pause: vi.fn(),
      play: vi.fn(async () => undefined),
      addEventListener: vi.fn((type: string, handler: () => void) => {
        if (type === "ended") {
          ended = handler;
        }
      }),
    };
    const revokeObjectUrl = vi.fn();

    playManagedWavBlobState({
      blob: new Blob(["wav"]),
      volume: 1.5,
      activeBlobAudioElements: registry,
      createObjectUrl: () => "blob://track",
      revokeObjectUrl,
      createAudio: () => audio,
      setTimeoutFn: vi.fn(),
      logger: { warn: vi.fn() },
    });

    expect(audio.volume).toBe(1);
    expect(registry.size).toBe(1);
    ended?.();
    expect(registry.size).toBe(0);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob://track");
  });

  it("cleans up managed wav blobs on timeout and rejected playback", async () => {
    const registry = createManagedBlobAudioRegistry();
    const revokeObjectUrl = vi.fn();
    const logger = { warn: vi.fn() };
    let timeoutHandler: (() => void) | null = null;

    const timeoutAudio = {
      volume: 0,
      currentTime: 0,
      pause: vi.fn(),
      play: vi.fn(async () => undefined),
      addEventListener: vi.fn(),
    };

    playManagedWavBlobState({
      blob: new Blob(["wav"]),
      volume: 0.4,
      activeBlobAudioElements: registry,
      createObjectUrl: () => "blob://timeout-track",
      revokeObjectUrl,
      createAudio: () => timeoutAudio,
      setTimeoutFn: (handler) => {
        timeoutHandler = handler;
        return 1;
      },
      logger,
    });

    expect(registry.has(timeoutAudio)).toBe(true);
    timeoutHandler?.();
    expect(registry.has(timeoutAudio)).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob://timeout-track");

    let rejectPlayback: ((error: Error) => void) | null = null;
    const failingAudio = {
      volume: 0,
      currentTime: 0,
      pause: vi.fn(),
      play: vi.fn(
        () =>
          new Promise((_, reject: (error: Error) => void) => {
            rejectPlayback = reject;
          }),
      ),
      addEventListener: vi.fn(),
    };

    playManagedWavBlobState({
      blob: new Blob(["wav"]),
      volume: 0.9,
      activeBlobAudioElements: registry,
      createObjectUrl: () => "blob://failing-track",
      revokeObjectUrl,
      createAudio: () => failingAudio,
      setTimeoutFn: vi.fn(),
      logger,
    });

    const playbackPromise = failingAudio.play.mock.results[0]?.value as Promise<unknown>;
    rejectPlayback?.(new Error("decode failed"));
    await playbackPromise.catch(() => undefined);
    await Promise.resolve();

    expect(logger.warn).toHaveBeenCalledWith(
      "[Maia Audio] WAV playback failed:",
      expect.any(Error),
    );
    expect(registry.has(failingAudio)).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob://failing-track");
  });

  it("resolves managed audio sources across runtime modes", () => {
    expect(
      resolveManagedAudioSourceState({
        audioPath: null,
        isTauriRuntime: true,
        convertFileSrc: vi.fn(),
      }),
    ).toBeNull();

    expect(
      resolveManagedAudioSourceState({
        audioPath: "browser-fallback://http://localhost/demo.wav",
        isTauriRuntime: false,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("http://localhost/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "http://localhost/direct.wav",
        isTauriRuntime: true,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("http://localhost/direct.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "samples/demo.wav",
        isTauriRuntime: false,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("./samples/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "/samples/demo.wav",
        isTauriRuntime: false,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("/samples/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "/tmp/demo.wav",
        isTauriRuntime: true,
        convertFileSrc: (path) => `asset://${path}`,
      }),
    ).toBe("asset:///tmp/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "/tmp/broken.wav",
        isTauriRuntime: true,
        convertFileSrc: () => {
          throw new Error("convert failed");
        },
      }),
    ).toBeNull();
  });
});
