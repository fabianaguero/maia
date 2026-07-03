import { describe, expect, it } from "vitest";

import type { BaseAssetRecord, LiveLogCue } from "../../src/types/library";
import {
  resolveArrangementVoices,
  resolveLiveSonificationScene,
  routeCueThroughScene,
} from "../../src/features/analyzer/components/liveSonificationScene";

const baseCue: LiveLogCue = {
  id: "cue-1",
  eventIndex: 0,
  level: "error",
  component: "api",
  excerpt: "500 response",
  noteHz: 220,
  durationMs: 180,
  gain: 0.16,
  waveform: "triangle",
  accent: "none",
};

describe("live sonification profiles", () => {
  it("resolves style and mutation profiles into the runtime scene", () => {
    const scene = resolveLiveSonificationScene(null, null, "alert-techno", "volatile", null);

    expect(scene.styleProfile.id).toBe("alert-techno");
    expect(scene.mutationProfile.id).toBe("volatile");
    expect(scene.genreId).toBe("techno");
    expect(scene.preset.useBeatGrid).toBe(true);
    expect(scene.preset.maxCuesPerWindow).toBeGreaterThan(8);
    expect(scene.preset.scheduleGapMs).toBeLessThan(80);
  });

  it("amplifies cue motion and gain when the mutation profile is more aggressive", () => {
    const subtleScene = resolveLiveSonificationScene(null, null, "steady-house", "subtle", null);
    const volatileScene = resolveLiveSonificationScene(
      null,
      null,
      "alert-techno",
      "volatile",
      null,
    );

    const subtleCue = routeCueThroughScene(baseCue, subtleScene, 0);
    const volatileCue = routeCueThroughScene(baseCue, volatileScene, 0);

    expect(volatileCue.noteHz).toBeGreaterThan(subtleCue.noteHz);
    expect(volatileCue.gain).toBeGreaterThan(subtleCue.gain);
    expect(volatileCue.routeLabel).toBeTruthy();
  });

  it("changes arrangement depth with the mutation profile", () => {
    const fullScene = resolveLiveSonificationScene(null, null, "steady-house", "balanced", null);
    const stackedScene = resolveLiveSonificationScene(null, null, "steady-house", "volatile", null);
    const routedCue = routeCueThroughScene(baseCue, fullScene, 0);

    const minimalVoices = resolveArrangementVoices([routedCue], "minimal");
    const fullVoices = resolveArrangementVoices(
      [routedCue],
      fullScene.mutationProfile.arrangementDepth,
    );
    const stackedVoices = resolveArrangementVoices(
      [routedCue],
      stackedScene.mutationProfile.arrangementDepth,
    );

    expect(minimalVoices).toHaveLength(1);
    expect(fullVoices.length).toBeGreaterThan(minimalVoices.length);
    expect(stackedVoices.length).toBeGreaterThan(fullVoices.length);
  });

  it("uses playable managed directory entries as live sample sources", () => {
    const baseAsset: BaseAssetRecord = {
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

    const scene = resolveLiveSonificationScene(baseAsset, null, "steady-house", "balanced", null);

    expect(scene.sampleSourceMode).toBe("multi-sample");
    expect(scene.sampleSourceCount).toBe(3);
    expect(scene.sampleSources.map((source) => source.path)).toEqual([
      "/tmp/kit/kick.wav",
      "/tmp/kit/snare.wav",
      "/tmp/kit/hat.ogg",
    ]);
  });

  it("lets the reference anchor override genre and preset when style stays on default", () => {
    const scene = resolveLiveSonificationScene(null, null, "steady-house", "balanced", {
      trackId: "anchor-1",
      trackTitle: "Anchor Track",
      musicStyleId: "techno",
      bpm: 132,
      energyLevel: 0.82,
      suggestedPresetId: "beat-locked",
    });

    expect(scene.genreId).toBe("techno");
    expect(scene.presetId).toBe("beat-locked");
    expect(scene.summary).toContain("Anchor Track");
  });

  it("uses a managed single-file base asset as the direct sample source", () => {
    const baseAsset: BaseAssetRecord = {
      id: "asset-file",
      title: "One Shot",
      sourcePath: "/tmp/one-shot.wav",
      storagePath: "/tmp/one-shot.wav",
      sourceKind: "file",
      importedAt: "2026-06-27T00:00:00Z",
      categoryId: "fx",
      categoryLabel: "FX",
      reusable: true,
      entryCount: 1,
      checksum: null,
      confidence: 0.9,
      summary: "single sample",
      analyzerStatus: "ready",
      notes: [],
      tags: [],
      metrics: {},
    };

    const scene = resolveLiveSonificationScene(baseAsset, null, "steady-house", "balanced", null);

    expect(scene.sampleSourceMode).toBe("single-sample");
    expect(scene.sampleSources).toEqual([{ path: "/tmp/one-shot.wav", label: "One Shot" }]);
    expect(scene.sampleSourceDetail).toContain("managed base-asset file");
  });

  it("falls back to the composition preview when the base asset cannot provide playable managed audio", () => {
    const baseAsset: BaseAssetRecord = {
      id: "asset-browser",
      title: "Browser fallback",
      sourcePath: "/tmp/browser",
      storagePath: "browser-fallback:///tmp/browser",
      sourceKind: "directory",
      importedAt: "2026-06-27T00:00:00Z",
      categoryId: "collection",
      categoryLabel: "Collection",
      reusable: true,
      entryCount: 0,
      checksum: null,
      confidence: 0.7,
      summary: "browser fallback",
      analyzerStatus: "ready",
      notes: [],
      tags: [],
      metrics: {
        playableAudioEntries: ["kick.wav"],
      },
    };

    const composition = {
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
    } as never;

    const scene = resolveLiveSonificationScene(
      baseAsset,
      composition,
      "steady-house",
      "balanced",
      null,
    );

    expect(scene.sampleSourceMode).toBe("single-sample");
    expect(scene.sampleSources).toEqual([
      { path: "/renders/hybrid-preview.wav", label: "Hybrid Mix" },
    ]);
    expect(scene.sampleSourceDetail).toContain("composition preview WAV");
  });

  it("stays on synth mode when no playable managed audio exists anywhere", () => {
    const baseAsset: BaseAssetRecord = {
      id: "asset-empty",
      title: "No audio",
      sourcePath: "/tmp/empty",
      storagePath: "/tmp/empty",
      sourceKind: "directory",
      importedAt: "2026-06-27T00:00:00Z",
      categoryId: "collection",
      categoryLabel: "Collection",
      reusable: true,
      entryCount: 1,
      checksum: null,
      confidence: 0.7,
      summary: "empty",
      analyzerStatus: "ready",
      notes: [],
      tags: [],
      metrics: {
        playableAudioEntries: ["notes.txt"],
        previewEntries: ["readme.md"],
      },
    };

    const composition = {
      id: "comp-2",
      title: "No Preview",
      previewAudioPath: "browser-fallback:///renders/preview.wav",
      referenceType: "track",
      targetBpm: 124,
      baseAssetCategoryId: "collection",
      baseAssetCategoryLabel: "Collection",
      strategy: "layered-pack",
      metrics: {},
    } as never;

    const scene = resolveLiveSonificationScene(
      baseAsset,
      composition,
      "steady-house",
      "balanced",
      null,
    );

    expect(scene.sampleSourceMode).toBe("synth");
    expect(scene.sampleSources).toEqual([]);
    expect(scene.sampleSourceDetail).toContain("internal synthesis");
  });

  it("mutes overridden components and routes anomaly cues distinctly", () => {
    const scene = resolveLiveSonificationScene(null, null, "alert-techno", "volatile", null);
    const anomalyCue: LiveLogCue = {
      ...baseCue,
      level: "info",
      accent: "anomaly",
      component: "worker",
    };

    const muted = routeCueThroughScene(
      anomalyCue,
      scene,
      1,
      ["worker", "api"],
      new Map([["worker", { muted: true }]]),
    );
    const routed = routeCueThroughScene(
      anomalyCue,
      scene,
      1,
      ["worker", "api"],
      new Map([["worker", { gainMult: 1.4 }]]),
    );

    expect(muted.routeLabel).toBe("muted");
    expect(muted.gain).toBe(0);
    expect(muted.durationMs).toBe(0);
    expect(routed.routeKey).toBe("anomaly");
    expect(routed.gain).toBeGreaterThan(baseCue.gain);
    expect(routed.pan).not.toBe(scene.routes.find((route) => route.key === "anomaly")?.pan);
  });
});
