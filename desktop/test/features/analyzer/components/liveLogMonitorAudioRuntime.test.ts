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
    const curve = createDriveCurve(2);
    expect(curve).toHaveLength(2048);
    expect(clamp01(-1)).toBe(0);
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

  it("resolves managed audio sources across runtime modes", () => {
    expect(
      resolveManagedAudioSourceState({
        audioPath: "browser-fallback://http://localhost/demo.wav",
        isTauriRuntime: false,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("http://localhost/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "samples/demo.wav",
        isTauriRuntime: false,
        convertFileSrc: vi.fn(),
      }),
    ).toBe("./samples/demo.wav");

    expect(
      resolveManagedAudioSourceState({
        audioPath: "/tmp/demo.wav",
        isTauriRuntime: true,
        convertFileSrc: (path) => `asset://${path}`,
      }),
    ).toBe("asset:///tmp/demo.wav");
  });
});
