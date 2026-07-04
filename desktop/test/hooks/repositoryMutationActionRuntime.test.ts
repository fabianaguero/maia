import { describe, expect, it, vi, beforeEach } from "vitest";

import type { RepositoryAnalysis } from "../../src/types/library";
import {
  analyzeRepositoryInBackground,
  deleteImportedRepository,
  importRepositoryWithBackgroundAnalysis,
  reanalyzeImportedRepository,
} from "../../src/hooks/repositoryMutationActionRuntime";

const analyzerMock = vi.hoisted(() => ({
  runAnalyzerRequest: vi.fn(),
}));

const repositoriesApiMock = vi.hoisted(() => ({
  checkRepositoryExists: vi.fn(),
  deleteRepository: vi.fn(),
  importRepository: vi.fn(),
}));

vi.mock("../../src/api/analyzer", () => analyzerMock);
vi.mock("../../src/api/repositories", async () => {
  const actual = await vi.importActual<object>("../../src/api/repositories");
  return {
    ...actual,
    checkRepositoryExists: repositoriesApiMock.checkRepositoryExists,
    deleteRepository: repositoriesApiMock.deleteRepository,
    importRepository: repositoriesApiMock.importRepository,
  };
});

function createRepository(
  id: string,
  importedAt: string,
  analyzerStatus = "ready",
): RepositoryAnalysis {
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
    analyzerStatus,
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

describe("repositoryMutationActionRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports, analyzes, reanalyzes and deletes repositories through pure helpers", async () => {
    const setRepositories = vi.fn();
    const pendingRepository = createRepository("pending", "2026-06-25T11:00:00.000Z", "pending");
    const reanalyzedRepository = createRepository("reanalyzed", "2026-06-25T12:00:00.000Z");

    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: {
        musicalAsset: {
          id: "asset-1",
          assetType: "repo_analysis",
          title: "pending",
          sourcePath: "/logs/pending.log",
          suggestedBpm: 126,
          confidence: 0.8,
          tags: [],
          metrics: {},
          artifacts: { waveformBins: [1, 2], beatGrid: [], bpmCurve: [] },
          createdAt: "2026-06-25T11:05:00.000Z",
        },
      },
    });
    repositoriesApiMock.importRepository
      .mockResolvedValueOnce(pendingRepository)
      .mockResolvedValueOnce(reanalyzedRepository);
    repositoriesApiMock.checkRepositoryExists.mockResolvedValue(true);
    repositoriesApiMock.deleteRepository.mockResolvedValue(undefined);

    await expect(
      analyzeRepositoryInBackground({ setRepositories }, pendingRepository),
    ).resolves.toBeUndefined();

    await expect(
      importRepositoryWithBackgroundAnalysis({
        state: { setRepositories },
        importInput: { sourceKind: "file", sourcePath: "/logs/pending.log" },
      }),
    ).resolves.toEqual(pendingRepository);

    await expect(
      reanalyzeImportedRepository({
        repositories: [pendingRepository],
        repositoryId: "pending",
      }),
    ).resolves.toEqual(reanalyzedRepository);

    await expect(deleteImportedRepository("reanalyzed")).resolves.toBe(true);

    expect(repositoriesApiMock.checkRepositoryExists).toHaveBeenCalledWith("/logs/pending.log");
    expect(repositoriesApiMock.deleteRepository).toHaveBeenCalledWith("reanalyzed");
  });
});
