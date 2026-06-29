import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CompositionResultRecord } from "../../src/types/library";
import { useCompositionResults } from "../../src/hooks/useCompositionResults";

const apiMock = vi.hoisted(() => ({
  importComposition: vi.fn(),
  listCompositions: vi.fn(),
}));

vi.mock("../../src/api/compositions", () => apiMock);

function createComposition(id: string, importedAt: string): CompositionResultRecord {
  return {
    id,
    title: id,
    sourcePath: `/compositions/${id}.json`,
    exportPath: null,
    previewAudioPath: null,
    sourceKind: "file",
    importedAt,
    baseAssetId: "base-1",
    baseAssetTitle: "Base 1",
    baseAssetCategoryId: "drums",
    baseAssetCategoryLabel: "Drums",
    basePlaylistId: null,
    basePlaylistName: null,
    referenceType: "track",
    referenceAssetId: "track-1",
    referenceTitle: "Track 1",
    referenceSourcePath: "/music/track-1.wav",
    targetBpm: 124,
    confidence: 0.9,
    strategy: "blend",
    summary: `${id} summary`,
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {},
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
  };
}

describe("useCompositionResults", () => {
  beforeEach(() => {
    apiMock.listCompositions.mockResolvedValue([]);
    apiMock.importComposition.mockResolvedValue(
      createComposition("composition-new", "2026-06-25T11:00:00.000Z"),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps sorted compositions and selects the newest one", async () => {
    apiMock.listCompositions.mockResolvedValue([
      createComposition("composition-a", "2026-06-25T10:00:00.000Z"),
      createComposition("composition-b", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useCompositionResults());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.compositions.map((entry) => entry.id)).toEqual([
      "composition-b",
      "composition-a",
    ]);
    expect(result.current.selectedCompositionId).toBe("composition-b");
  });

  it("imports a composition and surfaces failures", async () => {
    const { result } = renderHook(() => useCompositionResults());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importLibraryComposition({
        baseAssetId: "base-1",
        referenceType: "track",
        referenceAssetId: "track-1",
      });
    });

    expect(result.current.selectedCompositionId).toBe("composition-new");

    apiMock.importComposition.mockRejectedValueOnce(new Error("composition failed"));

    await act(async () => {
      const value = await result.current.importLibraryComposition({
        baseAssetId: "base-1",
        referenceType: "track",
        referenceAssetId: "track-1",
      });
      expect(value).toBeNull();
    });

    expect(result.current.error).toBe("composition failed");
  });
});
