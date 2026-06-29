import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RepositoryAnalysis } from "../../src/types/library";
import { useRepositories } from "../../src/hooks/useRepositories";

const analyzerMock = vi.hoisted(() => ({
  runAnalyzerRequest: vi.fn(),
}));

const repositoriesApiMock = vi.hoisted(() => ({
  checkRepositoryExists: vi.fn(),
  deleteRepository: vi.fn(),
  importRepository: vi.fn(),
  listRepositories: vi.fn(),
}));

vi.mock("../../src/api/analyzer", () => analyzerMock);
vi.mock("../../src/api/repositories", () => repositoriesApiMock);

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

describe("useRepositories", () => {
  beforeEach(() => {
    repositoriesApiMock.listRepositories.mockResolvedValue([]);
    repositoriesApiMock.importRepository.mockResolvedValue(
      createRepository("new", "2026-06-25T11:00:00.000Z"),
    );
    repositoriesApiMock.checkRepositoryExists.mockResolvedValue(true);
    repositoriesApiMock.deleteRepository.mockResolvedValue(undefined);
    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: {
        summary: "done",
        musicalAsset: {
          id: "asset-1",
          assetType: "repo_analysis",
          title: "new",
          sourcePath: "/logs/new.log",
          suggestedBpm: 126,
          confidence: 0.8,
          tags: [],
          metrics: {},
          artifacts: {
            waveformBins: [1, 2],
            beatGrid: [],
            bpmCurve: [],
          },
          createdAt: "2026-06-25T11:05:00.000Z",
        },
      },
      warnings: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps repositories and selects the newest one", async () => {
    repositoriesApiMock.listRepositories.mockResolvedValue([
      createRepository("older", "2026-06-25T10:00:00.000Z"),
      createRepository("newer", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useRepositories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.repositories.map((entry) => entry.id)).toEqual(["newer", "older"]);
    expect(result.current.selectedRepositoryId).toBe("newer");
  });

  it("imports and removes repositories", async () => {
    const { result } = renderHook(() => useRepositories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importRepositorySource({
        sourceKind: "file",
        sourcePath: "/logs/new.log",
      });
    });

    expect(result.current.repositories[0]?.id).toBe("new");
    expect(analyzerMock.runAnalyzerRequest).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.deleteLibraryRepository("new");
    });

    expect(result.current.repositories).toEqual([]);
  });

  it("reanalyzes pending repositories and surfaces failures", async () => {
    repositoriesApiMock.listRepositories.mockResolvedValue([
      createRepository("pending", "2026-06-25T10:00:00.000Z", "pending"),
    ]);
    repositoriesApiMock.importRepository.mockResolvedValue(
      createRepository("pending-import", "2026-06-25T11:00:00.000Z", "pending"),
    );

    const { result } = renderHook(() => useRepositories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importRepositorySource({
        sourceKind: "file",
        sourcePath: "/logs/new.log",
      });
    });

    await waitFor(() => {
      expect(analyzerMock.runAnalyzerRequest).toHaveBeenCalled();
    });

    repositoriesApiMock.checkRepositoryExists.mockResolvedValue(false);

    await act(async () => {
      const response = await result.current.reanalyzeRepository("pending");
      expect(response).toBeNull();
    });

    expect(result.current.error).toContain("Repository source not found");
  });
});
