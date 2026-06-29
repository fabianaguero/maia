import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildLibraryBaseAssetsViewModel } from "../../../src/features/library/libraryBaseAssetsViewModel";
import type { BaseAssetRecord } from "../../../src/types/library";

function createBaseAsset(input: {
  id: string;
  analyzerStatus: string;
  reusable?: boolean;
}): BaseAssetRecord {
  return {
    id: input.id,
    title: input.id,
    sourcePath: `/assets/${input.id}`,
    storagePath: `/managed/${input.id}`,
    sourceKind: "directory",
    importedAt: "2026-06-26T10:00:00.000Z",
    categoryId: "loops",
    categoryLabel: "Loops",
    reusable: input.reusable ?? false,
    entryCount: 12,
    checksum: null,
    confidence: 0.8,
    summary: "",
    analyzerStatus: input.analyzerStatus,
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("libraryBaseAssetsViewModel", () => {
  it("builds ready asset cards with compose enabled", () => {
    const model = buildLibraryBaseAssetsViewModel({
      assets: [createBaseAsset({ id: "asset-a", analyzerStatus: "ready", reusable: true })],
      newlyImportedId: "asset-a",
      selectedBaseAssetId: "asset-a",
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "asset-a",
      isSelected: true,
      isNewlyImported: true,
      title: "asset-a",
      meta: `Loops · 12 ${en.library.entries} · ${en.library.reusable}`,
      statusLabel: en.library.statusReady,
      statusClassName: "status-badge--ready",
      showComposeAction: true,
    });
  });

  it("builds pending asset cards", () => {
    const model = buildLibraryBaseAssetsViewModel({
      assets: [createBaseAsset({ id: "asset-b", analyzerStatus: "pending", reusable: false })],
      newlyImportedId: null,
      selectedBaseAssetId: null,
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "asset-b",
      isSelected: false,
      isNewlyImported: false,
      meta: `Loops · 12 ${en.library.entries}`,
      statusLabel: en.library.statusPending,
      statusClassName: "status-badge--pending",
      showComposeAction: false,
    });
  });
});
