import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { importMockBaseAsset } from "../../src/api/mockBaseAssets";
import {
  importMockCompositionResult,
  listMockCompositionResults,
} from "../../src/api/mockCompositionResults";
import {
  importMockTrack,
  saveMockPlaylist,
  updateMockTrackAnalysis,
} from "../../src/api/mockLibrary";
import { importMockRepository } from "../../src/api/mockRepositories";

const COMPOSITIONS_STORAGE_KEY = "maia.library.compositions.v1";

describe("mock composition results", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("imports and persists a manual composition plan with normalized fallback fields", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));

    const baseAsset = await importMockBaseAsset({
      sourceKind: "directory",
      sourcePath: "/tmp/base-packs/fx",
      categoryId: "fx-palette",
      reusable: false,
      label: "FX Palette",
    });

    const composition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "manual",
      manualBpm: 124,
      label: "Manual Sketch",
    });

    expect(composition.title).toBe("Manual Sketch");
    expect(composition.referenceType).toBe("manual");
    expect(composition.referenceTitle).toBe("Manual 124 BPM");
    expect(composition.basePlaylistId).toBeNull();
    expect(composition.basePlaylistName).toBeNull();
    expect(composition.exportPath).toContain(`/compositions/${composition.id}/plan.json`);
    expect(composition.previewAudioPath).toContain(`/compositions/${composition.id}/preview.wav`);
    expect(composition.notes).toContain(
      "The selected base asset is reference-only, so the composition remains a local sketch.",
    );
    expect(composition.tags).not.toContain("reusable-base");
    expect(composition.waveformBins).toHaveLength(56);
    expect(composition.beatGrid.length).toBeGreaterThan(0);
    const metrics = composition.metrics as {
      intensityBand?: string;
      previewAudioDurationSeconds?: number;
      arrangementSections?: Array<{ id: string }>;
      cuePoints?: Array<{ id: string }>;
      renderPreview?: { stems?: Array<{ id: string }> };
    };
    expect(metrics.intensityBand).toBe("steady");
    expect(composition.bpmCurve).toEqual([
      { second: 0, bpm: 124 },
      { second: Number(((metrics.previewAudioDurationSeconds ?? 0) / 2).toFixed(3)), bpm: 124 },
      { second: metrics.previewAudioDurationSeconds ?? 0, bpm: 124 },
    ]);
    expect(metrics.arrangementSections?.map((section) => section.id)).toEqual([
      "intro",
      "lift",
      "drop",
      "outro",
    ]);
    expect(metrics.cuePoints?.at(-1)?.id).toBe("cue-end");
    expect(metrics.renderPreview?.stems).toHaveLength(3);

    await expect(listMockCompositionResults()).resolves.toEqual([composition]);
  });

  it("supports track, playlist, and repository references and keeps newest compositions first", async () => {
    vi.useFakeTimers();

    const baseAsset = await importMockBaseAsset({
      sourceKind: "directory",
      sourcePath: "/tmp/base-packs/hook",
      categoryId: "vocal-hook",
      reusable: true,
      label: "Hook Rack",
    });
    const track = await importMockTrack({
      title: "Guide Track",
      sourcePath: "/tmp/guide-track.wav",
      musicStyleId: "house",
    });
    const playlist = await saveMockPlaylist({
      name: "Night Warmup",
      trackIds: [track.id],
    });
    const repository = await importMockRepository({
      sourceKind: "directory",
      sourcePath: "/tmp/repositories/payments-service",
      label: "payments-service",
    });

    vi.setSystemTime(new Date("2026-06-29T12:00:00.000Z"));
    const trackComposition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "track",
      trackId: track.id,
    });

    vi.setSystemTime(new Date("2026-06-29T12:01:00.000Z"));
    const playlistComposition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "playlist",
      playlistId: playlist.id,
    });

    vi.setSystemTime(new Date("2026-06-29T12:02:00.000Z"));
    const repoComposition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "repo",
      trackId: track.id,
      structureId: repository.id,
    });

    expect(trackComposition.analyzerStatus).toBe("Track-referenced composition plan");
    expect(trackComposition.referenceTitle).toBe("Guide Track");
    expect(playlistComposition.analyzerStatus).toBe("Playlist-referenced composition plan");
    expect(playlistComposition.basePlaylistId).toBe(playlist.id);
    expect(playlistComposition.basePlaylistName).toBe("Night Warmup");
    expect(repoComposition.analyzerStatus).toBe("Repository-referenced composition plan");
    expect(repoComposition.referenceTitle).toContain("structured by payments-service");
    expect(repoComposition.referenceSourcePath).toBe(repository.sourcePath);
    expect(repoComposition.targetBpm).toBe(repository.suggestedBpm);

    const repoMetrics = repoComposition.metrics as {
      renderPreview?: { stems?: Array<{ id: string }> };
      arrangementSections?: Array<{ id: string }>;
    };
    expect(repoMetrics.renderPreview?.stems).toHaveLength(4);
    expect(repoMetrics.arrangementSections?.[1]?.id).toBe("translation");
    expect(repoComposition.tags).toContain("reusable-base");

    const compositions = await listMockCompositionResults();
    expect(compositions.map((entry) => entry.id)).toEqual([
      repoComposition.id,
      playlistComposition.id,
      trackComposition.id,
    ]);
  });

  it("normalizes stored records and rejects invalid composition requests", async () => {
    const stored = {
      id: "composition-1",
      title: "Stored Composition",
      sourcePath: "/tmp/composition.json",
      sourceKind: "directory",
      importedAt: "2026-06-29T12:00:00.000Z",
      baseAssetId: "asset-1",
      baseAssetTitle: "Asset 1",
      baseAssetCategoryId: "drum-kit",
      baseAssetCategoryLabel: "Drum kit",
      referenceType: "manual",
      referenceAssetId: null,
      referenceTitle: "Manual 120 BPM",
      referenceSourcePath: null,
      targetBpm: 120,
      confidence: 0.72,
      strategy: "rhythm-foundation",
      summary: "Stored summary",
      analyzerStatus: "Manual-tempo composition plan",
      notes: [],
      tags: [],
      metrics: {},
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
    };

    window.localStorage.setItem(COMPOSITIONS_STORAGE_KEY, JSON.stringify([stored]));
    await expect(listMockCompositionResults()).resolves.toEqual([
      expect.objectContaining({
        id: "composition-1",
        exportPath: null,
        previewAudioPath: null,
        basePlaylistId: null,
        basePlaylistName: null,
      }),
    ]);

    window.localStorage.setItem(COMPOSITIONS_STORAGE_KEY, "{bad json");
    await expect(listMockCompositionResults()).resolves.toEqual([]);

    await expect(
      importMockCompositionResult({
        baseAssetId: "missing-base",
        referenceType: "manual",
        manualBpm: 124,
      }),
    ).rejects.toThrow("Select a base asset before composing.");

    const baseAsset = await importMockBaseAsset({
      sourceKind: "file",
      sourcePath: "/tmp/base.wav",
      categoryId: "bass-motif",
      reusable: true,
      label: "Bass motif",
    });

    await expect(
      importMockCompositionResult({
        baseAssetId: baseAsset.id,
        referenceType: "manual",
      }),
    ).rejects.toThrow("Manual composition mode requires a positive BPM.");

    await expect(
      importMockCompositionResult({
        baseAssetId: baseAsset.id,
        referenceType: "track",
        trackId: "missing-track",
      }),
    ).rejects.toThrow("Select a track with stored BPM before composing.");

    await expect(
      importMockCompositionResult({
        baseAssetId: baseAsset.id,
        referenceType: "playlist",
        playlistId: "missing-playlist",
      }),
    ).rejects.toThrow("Select a saved playlist before composing.");

    await expect(
      importMockCompositionResult({
        baseAssetId: baseAsset.id,
        referenceType: "repo",
        structureId: "missing-repo",
      }),
    ).rejects.toThrow("Select a repository with suggested BPM before composing.");
  });

  it("falls back to repository-only references and timestamp ids when crypto is unavailable", async () => {
    vi.useFakeTimers();
    const fallbackNow = new Date("2026-06-29T12:30:00.000Z");
    vi.setSystemTime(fallbackNow);
    vi.stubGlobal("crypto", undefined);

    const baseAsset = await importMockBaseAsset({
      sourceKind: "directory",
      sourcePath: "/tmp/base-packs/drums",
      categoryId: "drum-kit",
      reusable: true,
      label: "Drum Rack",
    });
    const repository = await importMockRepository({
      sourceKind: "directory",
      sourcePath: "/tmp/repositories/incident-router",
      label: "incident-router",
    });

    const composition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "repo",
      structureId: repository.id,
    });

    expect(composition.id).toMatch(new RegExp(`^composition-${fallbackNow.getTime()}-\\d+$`));
    expect(composition.referenceTitle).toBe("incident-router");
    expect(composition.referenceSourcePath).toBe(repository.sourcePath);
    expect(composition.targetBpm).toBe(repository.suggestedBpm);
  });

  it("supports bass-motif playlist previews and rejects playlists without analyzed BPM", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T13:00:00.000Z"));

    const baseAsset = await importMockBaseAsset({
      sourceKind: "directory",
      sourcePath: "/tmp/base-packs/bass",
      categoryId: "bass-motif",
      reusable: true,
      label: "Bass Rack",
    });
    const validTrack = await importMockTrack({
      title: "Bass Anchor",
      sourcePath: "/tmp/bass-anchor.wav",
      musicStyleId: "house",
    });
    const validPlaylist = await saveMockPlaylist({
      name: "Bassline Focus",
      trackIds: [validTrack.id],
    });

    const composition = await importMockCompositionResult({
      baseAssetId: baseAsset.id,
      referenceType: "playlist",
      playlistId: validPlaylist.id,
    });

    const renderPreview = (
      composition.metrics as {
        renderPreview?: { stems?: Array<{ id: string; label: string; focus: string }> };
      }
    ).renderPreview;
    expect(renderPreview?.stems?.some((stem) => stem.id === "stem-spotlight")).toBe(true);
    expect(renderPreview?.stems?.find((stem) => stem.id === "stem-spotlight")?.label).toBe(
      "Low-end spotlight",
    );
    expect(renderPreview?.stems?.find((stem) => stem.id === "stem-spotlight")?.focus).toContain(
      "bass motif",
    );

    const bpmLessTrack = await importMockTrack({
      title: "Unanalyzed Track",
      sourcePath: "/tmp/unanalyzed.wav",
      musicStyleId: "house",
    });
    await updateMockTrackAnalysis(bpmLessTrack.id, { bpm: null });

    const invalidPlaylist = await saveMockPlaylist({
      name: "No BPM",
      trackIds: [bpmLessTrack.id],
    });

    await expect(
      importMockCompositionResult({
        baseAssetId: baseAsset.id,
        referenceType: "playlist",
        playlistId: invalidPlaylist.id,
      }),
    ).rejects.toThrow("Select a playlist with at least one analyzed BPM before composing.");
  });
});
