import { describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../src/types/library";
import {
  loadCachedBackgroundBuffer,
  resolveBackgroundTrackUrl,
  snapshotBackgroundDeckState,
} from "../../src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime";

function createTrack(path = "/tmp/demo.wav"): LibraryTrack {
  return {
    id: "track-1",
    file: {
      sourcePath: path,
      storagePath: path,
      playbackSource: "source_file",
      availabilityState: "available",
      sizeBytes: null,
      checksum: null,
    },
    tags: {
      title: "Demo",
      artist: "MAIA",
      album: null,
      genre: "House",
      musicStyleId: null,
      bpm: null,
      key: null,
      durationSec: 180,
    },
    analysis: {
      bpm: 126,
      energy: 0.5,
      waveformBins: [0.2, 0.4],
      beatGrid: [],
      key: null,
      loudnessDb: -8,
      durationSec: 180,
    },
    performance: {
      rating: null,
      color: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
      playedCount: 0,
      lastPlayedAt: null,
    },
    title: "Demo",
    sourcePath: path,
    storagePath: path,
    importedAt: new Date().toISOString(),
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [0.2, 0.4],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: 0.5,
    danceability: 0.7,
    structuralPatterns: [],
  };
}

describe("liveLogMonitorBackgroundDeckRuntime", () => {
  it("returns null snapshots when no deck is active", () => {
    expect(snapshotBackgroundDeckState(null)).toBeNull();
  });

  it("snapshots only lifecycle-relevant deck fields", () => {
    const snapshot = snapshotBackgroundDeckState({
      source: {} as AudioBufferSourceNode,
      buffer: {} as AudioBuffer,
      gain: {} as GainNode,
      trackId: "track-1",
      trackIndex: 2,
      startedAtContextTime: 1.2,
      bufferDurationSec: 180,
      durationSec: 90,
      entrySecond: 12,
      playbackRate: 1.04,
      looping: false,
    });

    expect(snapshot).toEqual({
      trackId: "track-1",
      trackIndex: 2,
      looping: false,
      entrySecond: 12,
      playbackRate: 1.04,
      durationSec: 90,
    });
  });

  it("resolves a background track url for web runtimes", () => {
    const url = resolveBackgroundTrackUrl({
      track: createTrack("/tmp/demo.wav"),
      isTauriRuntime: false,
      convertFileSrc: (path) => `asset://${path}`,
    });

    expect(url).toBe("/tmp/demo.wav");
  });

  it("returns null when the playable source path is missing or tauri conversion fails", () => {
    expect(
      resolveBackgroundTrackUrl({
        track: createTrack(""),
        isTauriRuntime: false,
        convertFileSrc: (path) => `asset://${path}`,
      }),
    ).toBeNull();

    expect(
      resolveBackgroundTrackUrl({
        track: createTrack("/tmp/demo.wav"),
        isTauriRuntime: true,
        convertFileSrc: () => {
          throw new Error("boom");
        },
      }),
    ).toBeNull();
  });

  it("uses tauri path conversion when available", () => {
    expect(
      resolveBackgroundTrackUrl({
        track: createTrack("/tmp/demo.wav"),
        isTauriRuntime: true,
        convertFileSrc: (path) => `asset://${path}`,
      }),
    ).toBe("asset:///tmp/demo.wav");
  });

  it("loads and caches background buffers", async () => {
    const decodeAudioData = vi.fn(async () => ({ id: "decoded" }) as unknown as AudioBuffer);
    const context = { decodeAudioData } as unknown as AudioContext;
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;
    const cache = new Map<string, Promise<AudioBuffer>>();

    const first = await loadCachedBackgroundBuffer({
      context,
      track: createTrack(),
      cache,
      isTauriRuntime: false,
      convertFileSrc: (path) => `asset://${path}`,
      fetchImpl,
    });
    const second = await loadCachedBackgroundBuffer({
      context,
      track: createTrack(),
      cache,
      isTauriRuntime: false,
      convertFileSrc: (path) => `asset://${path}`,
      fetchImpl,
    });

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns null when the track has no playable path or no resolved url", async () => {
    const decodeAudioData = vi.fn(async () => ({ id: "decoded" }) as unknown as AudioBuffer);
    const context = { decodeAudioData } as unknown as AudioContext;
    const fetchImpl = vi.fn();
    const cache = new Map<string, Promise<AudioBuffer>>();

    const missingPath = await loadCachedBackgroundBuffer({
      context,
      track: createTrack(""),
      cache,
      isTauriRuntime: false,
      convertFileSrc: (path) => `asset://${path}`,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const brokenTauriUrl = await loadCachedBackgroundBuffer({
      context,
      track: createTrack("/tmp/demo.wav"),
      cache,
      isTauriRuntime: true,
      convertFileSrc: () => {
        throw new Error("broken");
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(missingPath).toBeNull();
    expect(brokenTauriUrl).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("evicts failed cache entries so a later retry can succeed", async () => {
    const decodeAudioData = vi.fn(async () => ({ id: "decoded" }) as unknown as AudioBuffer);
    const context = { decodeAudioData } as unknown as AudioContext;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      });
    const cache = new Map<string, Promise<AudioBuffer>>();

    await expect(
      loadCachedBackgroundBuffer({
        context,
        track: createTrack(),
        cache,
        isTauriRuntime: false,
        convertFileSrc: (path) => `asset://${path}`,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow("HTTP 503 fetching guide track");
    expect(cache.size).toBe(0);

    const recovered = await loadCachedBackgroundBuffer({
      context,
      track: createTrack(),
      cache,
      isTauriRuntime: false,
      convertFileSrc: (path) => `asset://${path}`,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(recovered).toBeTruthy();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(1);
  });
});
