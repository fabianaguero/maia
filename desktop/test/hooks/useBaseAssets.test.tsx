import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseAssetRecord } from "../../src/types/library";
import { useBaseAssets } from "../../src/hooks/useBaseAssets";

const apiMock = vi.hoisted(() => ({
  importBaseAsset: vi.fn(),
  listBaseAssets: vi.fn(),
}));

vi.mock("../../src/api/baseAssets", () => apiMock);

function createBaseAsset(id: string, importedAt: string): BaseAssetRecord {
  return {
    id,
    title: id,
    sourcePath: `/assets/${id}`,
    storagePath: `/storage/${id}`,
    sourceKind: "directory",
    importedAt,
    categoryId: "drums",
    categoryLabel: "Drums",
    reusable: true,
    entryCount: 4,
    checksum: null,
    confidence: 0.8,
    summary: `${id} summary`,
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("useBaseAssets", () => {
  beforeEach(() => {
    apiMock.listBaseAssets.mockResolvedValue([]);
    apiMock.importBaseAsset.mockResolvedValue(
      createBaseAsset("asset-new", "2026-06-25T11:00:00.000Z"),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps sorted assets and selects the newest one", async () => {
    apiMock.listBaseAssets.mockResolvedValue([
      createBaseAsset("asset-a", "2026-06-25T10:00:00.000Z"),
      createBaseAsset("asset-b", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useBaseAssets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.baseAssets.map((entry) => entry.id)).toEqual(["asset-b", "asset-a"]);
    expect(result.current.selectedBaseAssetId).toBe("asset-b");
  });

  it("imports a base asset and surfaces failures", async () => {
    const { result } = renderHook(() => useBaseAssets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importLibraryBaseAsset({
        sourceKind: "directory",
        sourcePath: "/assets/new-pack",
        categoryId: "drums",
        reusable: true,
      });
    });

    expect(result.current.selectedBaseAssetId).toBe("asset-new");

    apiMock.importBaseAsset.mockRejectedValueOnce(new Error("import failed"));

    await act(async () => {
      const value = await result.current.importLibraryBaseAsset({
        sourceKind: "directory",
        sourcePath: "/assets/bad-pack",
        categoryId: "drums",
        reusable: true,
      });
      expect(value).toBeNull();
    });

    expect(result.current.error).toBe("import failed");
  });
});
