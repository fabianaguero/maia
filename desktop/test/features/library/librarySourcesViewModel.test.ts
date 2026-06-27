import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildLibrarySourcesViewModel } from "../../../src/features/library/librarySourcesViewModel";
import type { RepositoryAnalysis } from "../../../src/types/library";

function createRepository(input: {
  id: string;
  title: string;
  sourceKind: "directory" | "file" | "url";
  suggestedBpm?: number | null;
  primaryLanguage?: string;
}): RepositoryAnalysis {
  return {
    id: input.id,
    title: input.title,
    sourcePath: `/repo/${input.id}`,
    storagePath: null,
    sourceKind: input.sourceKind,
    importedAt: "2026-06-26T10:00:00.000Z",
    suggestedBpm: input.suggestedBpm ?? null,
    confidence: 0.7,
    summary: "",
    analyzerStatus: "ready",
    buildSystem: "",
    primaryLanguage: input.primaryLanguage ?? "",
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

describe("librarySourcesViewModel", () => {
  it("builds analyzed source cards", () => {
    const model = buildLibrarySourcesViewModel({
      newlyImportedId: null,
      repositories: [
        createRepository({
          id: "repo-a",
          title: "Repo A",
          sourceKind: "directory",
          suggestedBpm: 128,
          primaryLanguage: "TypeScript",
        }),
      ],
      selectedRepositoryId: "repo-a",
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "repo-a",
      isSelected: true,
      isNewlyImported: false,
      title: "Repo A",
      meta: "Directory · 128 BPM · TypeScript",
      shouldAnalyze: false,
      actionLabel: en.library.view,
    });
  });

  it("builds pending source cards", () => {
    const model = buildLibrarySourcesViewModel({
      newlyImportedId: "repo-b",
      repositories: [
        createRepository({
          id: "repo-b",
          title: "Repo B",
          sourceKind: "file",
          suggestedBpm: null,
        }),
      ],
      selectedRepositoryId: null,
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "repo-b",
      isSelected: false,
      isNewlyImported: true,
      title: "Repo B",
      meta: "Log file · -",
      shouldAnalyze: true,
      actionLabel: en.library.analyze,
    });
  });
});
