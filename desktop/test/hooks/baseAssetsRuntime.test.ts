import { describe, expect, it } from "vitest";

import type { BaseAssetRecord } from "../../src/types/library";
import {
  appendImportedBaseAsset,
  resolveSelectedBaseAssetId,
  sortBaseAssetsByImportedAt,
  toBaseAssetErrorMessage,
} from "../../src/hooks/baseAssetsRuntime";

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

describe("baseAssetsRuntime", () => {
  it("sorts and appends imported assets by importedAt desc", () => {
    const older = createBaseAsset("older", "2026-06-25T10:00:00.000Z");
    const newer = createBaseAsset("newer", "2026-06-25T11:00:00.000Z");

    expect(sortBaseAssetsByImportedAt([older, newer]).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(appendImportedBaseAsset([older], newer).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("keeps valid selection or falls back to the first asset", () => {
    const baseAssets = [
      createBaseAsset("a", "2026-06-25T10:00:00.000Z"),
      createBaseAsset("b", "2026-06-25T11:00:00.000Z"),
    ];

    expect(resolveSelectedBaseAssetId("a", baseAssets)).toBe("a");
    expect(resolveSelectedBaseAssetId("missing", baseAssets)).toBe("a");
    expect(resolveSelectedBaseAssetId(null, [])).toBeNull();
  });

  it("normalizes error messages", () => {
    expect(toBaseAssetErrorMessage(new Error("boom"))).toBe("boom");
    expect(toBaseAssetErrorMessage("failed")).toBe("failed");
    expect(toBaseAssetErrorMessage({})).toBe("Unexpected base asset failure.");
  });
});
