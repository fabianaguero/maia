import { describe, expect, it } from "vitest";

import type { CompositionResultRecord } from "../../src/types/library";
import {
  appendImportedComposition,
  resolveSelectedCompositionId,
  sortCompositionsByImportedAt,
  toCompositionErrorMessage,
} from "../../src/hooks/compositionResultsRuntime";

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

describe("compositionResultsRuntime", () => {
  it("sorts and appends imported compositions by importedAt desc", () => {
    const older = createComposition("older", "2026-06-25T10:00:00.000Z");
    const newer = createComposition("newer", "2026-06-25T11:00:00.000Z");

    expect(sortCompositionsByImportedAt([older, newer]).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(appendImportedComposition([older], newer).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("keeps valid selection or falls back to the first composition", () => {
    const compositions = [
      createComposition("a", "2026-06-25T10:00:00.000Z"),
      createComposition("b", "2026-06-25T11:00:00.000Z"),
    ];

    expect(resolveSelectedCompositionId("a", compositions)).toBe("a");
    expect(resolveSelectedCompositionId("missing", compositions)).toBe("a");
    expect(resolveSelectedCompositionId(null, [])).toBeNull();
  });

  it("normalizes composition error messages", () => {
    expect(toCompositionErrorMessage(new Error("boom"))).toBe("boom");
    expect(toCompositionErrorMessage("failed")).toBe("failed");
    expect(toCompositionErrorMessage({})).toBe("Unexpected composition failure.");
  });
});
