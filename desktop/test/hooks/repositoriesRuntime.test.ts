import { describe, expect, it } from "vitest";

import type { AnalyzerResponse, MusicalAsset } from "../../src/contracts";
import type { RepositoryAnalysis } from "../../src/types/library";
import {
  appendImportedRepository,
  applyAnalyzedRepositoryMetadata,
  clearDeletedSelectedRepositoryId,
  removeDeletedRepository,
  replaceReanalyzedRepository,
  resolveReanalyzeRepositoryInput,
  resolveRepositoryAnalysisPayload,
  resolveSelectedRepositoryId,
  shouldAnalyzeImportedRepository,
  sortRepositoriesByImportedAt,
  toRepositoryErrorMessage,
} from "../../src/hooks/repositoriesRuntime";

function createRepository(id: string, importedAt: string): RepositoryAnalysis {
  return {
    id,
    title: `${id}.log`,
    sourcePath: `/logs/${id}.log`,
    storagePath: null,
    sourceKind: "file",
    importedAt,
    suggestedBpm: null,
    confidence: 0,
    summary: "",
    analyzerStatus: "pending",
    buildSystem: "",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("repositoriesRuntime", () => {
  it("sorts and appends repositories deterministically", () => {
    const older = createRepository("older", "2026-06-25T10:00:00.000Z");
    const newer = createRepository("newer", "2026-06-25T11:00:00.000Z");

    expect(sortRepositoriesByImportedAt([older, newer]).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(appendImportedRepository([older], newer).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("resolves selection, deletion and reanalyze input", () => {
    const older = createRepository("older", "2026-06-25T10:00:00.000Z");
    const newer = createRepository("newer", "2026-06-25T11:00:00.000Z");

    expect(resolveSelectedRepositoryId("older", [older, newer])).toBe("older");
    expect(resolveSelectedRepositoryId("missing", [older, newer])).toBe("older");
    expect(clearDeletedSelectedRepositoryId("older", "older")).toBeNull();
    expect(removeDeletedRepository([older, newer], "older")).toEqual([newer]);
    expect(resolveReanalyzeRepositoryInput(older)).toEqual({
      sourceKind: "file",
      sourcePath: "/logs/older.log",
      label: "older.log",
    });
  });

  it("applies analyzer metadata and extracts payloads", () => {
    const repository = createRepository("orders", "2026-06-25T11:00:00.000Z");
    const analyzed: MusicalAsset = {
      id: "asset-1",
      assetType: "repo_analysis",
      title: "orders",
      sourcePath: "/logs/orders.log",
      suggestedBpm: 128,
      confidence: 0.8,
      tags: [],
      metrics: {},
      artifacts: {
        waveformBins: [1, 2],
        beatGrid: [],
        bpmCurve: [],
      },
      createdAt: "2026-06-25T11:30:00.000Z",
    };
    const response: AnalyzerResponse = {
      contractVersion: "1.0",
      requestId: "analyze-1",
      status: "ok",
      payload: {
        summary: "done",
        musicalAsset: analyzed,
      },
      warnings: [],
    };

    expect(resolveRepositoryAnalysisPayload(response)).toBe(analyzed);
    expect(shouldAnalyzeImportedRepository(repository)).toBe(true);
    expect(applyAnalyzedRepositoryMetadata([repository], repository.id, analyzed)[0]).toMatchObject(
      {
        suggestedBpm: 128,
        confidence: 0.8,
        waveformBins: [1, 2],
      },
    );
  });

  it("formats runtime errors and replaces a reanalyzed repository", () => {
    const older = createRepository("older", "2026-06-25T10:00:00.000Z");
    const newer = createRepository("newer", "2026-06-25T11:00:00.000Z");
    const replacement = {
      ...older,
      importedAt: "2026-06-25T12:00:00.000Z",
      suggestedBpm: 124,
    };

    expect(replaceReanalyzedRepository([older, newer], "older", replacement)[0]).toBe(replacement);
    expect(toRepositoryErrorMessage(new Error("boom"), "fallback")).toBe("boom");
    expect(toRepositoryErrorMessage("", "fallback")).toBe("fallback");
  });
});
