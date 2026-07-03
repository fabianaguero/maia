import { describe, expect, it } from "vitest";

import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LiveLogCue,
} from "../../../../src/types/library";
import {
  isPlayableAudioPath,
  joinManagedPath,
  resolveSceneSampleSources,
  routeKeyForCue,
  routeSampleAssignment,
} from "../../../../src/features/analyzer/components/liveSonificationSampleSourceRuntime";

function createCue(overrides: Partial<LiveLogCue> = {}): LiveLogCue {
  return {
    id: "cue-1",
    eventIndex: 0,
    level: "info",
    component: "api",
    excerpt: "ok",
    noteHz: 220,
    durationMs: 180,
    gain: 0.16,
    waveform: "triangle",
    accent: "none",
    ...overrides,
  };
}

describe("liveSonificationSampleSourceRuntime", () => {
  it("detects playable audio paths and joins managed paths on unix/windows roots", () => {
    expect(isPlayableAudioPath("/tmp/one-shot.WAV")).toBe(true);
    expect(isPlayableAudioPath("/tmp/readme.txt")).toBe(false);

    expect(joinManagedPath("/tmp/kit/", "drums/kick.wav")).toBe("/tmp/kit/drums/kick.wav");
    expect(joinManagedPath("C:\\kit\\", "drums/snare.wav")).toBe("C:\\kit\\drums\\snare.wav");
  });

  it("resolves base asset and composition sample source fallbacks", () => {
    const directoryAsset: BaseAssetRecord = {
      id: "asset-1",
      title: "Managed kit",
      sourcePath: "/tmp/kit",
      storagePath: "/tmp/kit",
      sourceKind: "directory",
      importedAt: "2026-06-27T00:00:00Z",
      categoryId: "drum-kit",
      categoryLabel: "Drum Kit",
      reusable: true,
      entryCount: 3,
      checksum: null,
      confidence: 0.9,
      summary: "kit",
      analyzerStatus: "ready",
      notes: [],
      tags: [],
      metrics: {
        playableAudioEntries: ["kick.wav", "snare.wav", "notes.txt"],
        previewEntries: ["snare.wav", "hat.ogg"],
      },
    };

    const composition: CompositionResultRecord = {
      id: "comp-1",
      title: "Hybrid Mix",
      previewAudioPath: "/renders/hybrid-preview.wav",
      referenceTitle: "Hybrid Mix",
      referenceType: "track",
      targetBpm: 126,
      strategy: "layered-pack",
      baseAssetCategoryId: "collection",
      baseAssetCategoryLabel: "Collection",
      metrics: {},
    } as CompositionResultRecord;

    const directoryResult = resolveSceneSampleSources(directoryAsset, composition);
    expect(directoryResult.mode).toBe("multi-sample");
    expect(directoryResult.sources.map((source) => source.path)).toEqual([
      "/tmp/kit/kick.wav",
      "/tmp/kit/snare.wav",
      "/tmp/kit/hat.ogg",
    ]);

    const previewResult = resolveSceneSampleSources(
      {
        ...directoryAsset,
        storagePath: "browser-fallback:///tmp/kit",
      },
      composition,
    );
    expect(previewResult.mode).toBe("single-sample");
    expect(previewResult.sources).toEqual([
      { path: "/renders/hybrid-preview.wav", label: "Hybrid Mix" },
    ]);

    const synthResult = resolveSceneSampleSources(
      {
        ...directoryAsset,
        metrics: {
          playableAudioEntries: ["notes.txt"],
          previewEntries: ["readme.md"],
        },
      },
      {
        ...composition,
        previewAudioPath: "browser-fallback:///renders/hybrid-preview.wav",
      },
    );
    expect(synthResult.mode).toBe("synth");
    expect(synthResult.sources).toEqual([]);
  });

  it("maps route keys and sample assignments deterministically", () => {
    expect(routeKeyForCue(createCue())).toBe("info");
    expect(routeKeyForCue(createCue({ level: "warn" }))).toBe("warn");
    expect(routeKeyForCue(createCue({ level: "error" }))).toBe("error");
    expect(routeKeyForCue(createCue({ accent: "anomaly" }))).toBe("anomaly");

    const sources = [
      { path: "/kit/info.wav", label: "info" },
      { path: "/kit/warn.wav", label: "warn" },
      { path: "/kit/error.wav", label: "error" },
      { path: "/kit/anomaly.wav", label: "anomaly" },
    ];

    expect(routeSampleAssignment([], "info")).toEqual({
      samplePath: null,
      sampleLabel: null,
    });
    expect(routeSampleAssignment([sources[0]!], "warn")).toEqual({
      samplePath: "/kit/info.wav",
      sampleLabel: "info",
    });
    expect(routeSampleAssignment(sources, "info")).toEqual({
      samplePath: "/kit/info.wav",
      sampleLabel: "info",
    });
    expect(routeSampleAssignment(sources, "warn")).toEqual({
      samplePath: "/kit/warn.wav",
      sampleLabel: "warn",
    });
    expect(routeSampleAssignment(sources, "error")).toEqual({
      samplePath: "/kit/error.wav",
      sampleLabel: "error",
    });
    expect(routeSampleAssignment(sources, "anomaly")).toEqual({
      samplePath: "/kit/anomaly.wav",
      sampleLabel: "anomaly",
    });
  });
});
