import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRepositoriesBootstrap } from "../../src/hooks/useRepositoriesBootstrap";
import type { RepositoryAnalysis } from "../../src/types/library";

const repositoriesApiMock = vi.hoisted(() => ({
  listRepositories: vi.fn(),
}));

vi.mock("../../src/api/repositories", () => repositoriesApiMock);

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
    analyzerStatus: "ready",
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

describe("useRepositoriesBootstrap", () => {
  it("hydrates sorted repositories and resolves the selected id", async () => {
    repositoriesApiMock.listRepositories.mockResolvedValue([
      createRepository("older", "2026-06-25T10:00:00.000Z"),
      createRepository("newer", "2026-06-25T11:00:00.000Z"),
    ]);

    const setRepositories = vi.fn();
    const setSelectedRepositoryId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    renderHook(() =>
      useRepositoriesBootstrap({
        setRepositories,
        setSelectedRepositoryId,
        setLoading,
        setError,
      }),
    );

    await waitFor(() => {
      expect(setRepositories).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "newer" })]),
      );
    });

    expect(
      setRepositories.mock.calls.at(-1)?.[0].map((entry: RepositoryAnalysis) => entry.id),
    ).toEqual(["newer", "older"]);
    expect(setSelectedRepositoryId).toHaveBeenCalledWith(expect.any(Function));
    const resolver = setSelectedRepositoryId.mock.calls.at(-1)?.[0] as (
      current: string | null,
    ) => string | null;
    expect(resolver("older")).toBe("older");
    expect(resolver("missing")).toBe("newer");
    expect(setError).toHaveBeenCalledWith(null);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("normalizes bootstrap failures into a user-facing error", async () => {
    repositoriesApiMock.listRepositories.mockRejectedValue(new Error("repo bootstrap failed"));

    const setRepositories = vi.fn();
    const setSelectedRepositoryId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    renderHook(() =>
      useRepositoriesBootstrap({
        setRepositories,
        setSelectedRepositoryId,
        setLoading,
        setError,
      }),
    );

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith("repo bootstrap failed");
    });

    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setRepositories).not.toHaveBeenCalled();
  });

  it("ignores late bootstrap success and failure after unmount", async () => {
    let resolveRepositories: ((repositories: RepositoryAnalysis[]) => void) | null = null;
    let rejectRepositories: ((error: Error) => void) | null = null;
    repositoriesApiMock.listRepositories
      .mockImplementationOnce(
        () =>
          new Promise<RepositoryAnalysis[]>((resolve) => {
            resolveRepositories = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<RepositoryAnalysis[]>((_, reject) => {
            rejectRepositories = reject;
          }),
      );

    const successSetRepositories = vi.fn();
    const successSetSelectedRepositoryId = vi.fn();
    const successSetLoading = vi.fn();
    const successSetError = vi.fn();
    const successView = renderHook(() =>
      useRepositoriesBootstrap({
        setRepositories: successSetRepositories,
        setSelectedRepositoryId: successSetSelectedRepositoryId,
        setLoading: successSetLoading,
        setError: successSetError,
      }),
    );

    successView.unmount();
    resolveRepositories?.([createRepository("late", "2026-06-25T10:00:00.000Z")]);
    await Promise.resolve();

    expect(successSetRepositories).not.toHaveBeenCalled();
    expect(successSetSelectedRepositoryId).not.toHaveBeenCalled();
    expect(successSetLoading).not.toHaveBeenCalled();
    expect(successSetError).not.toHaveBeenCalled();

    const failureSetRepositories = vi.fn();
    const failureSetSelectedRepositoryId = vi.fn();
    const failureSetLoading = vi.fn();
    const failureSetError = vi.fn();
    const failureView = renderHook(() =>
      useRepositoriesBootstrap({
        setRepositories: failureSetRepositories,
        setSelectedRepositoryId: failureSetSelectedRepositoryId,
        setLoading: failureSetLoading,
        setError: failureSetError,
      }),
    );

    failureView.unmount();
    rejectRepositories?.(new Error("late repo bootstrap failure"));
    await Promise.resolve();

    expect(failureSetRepositories).not.toHaveBeenCalled();
    expect(failureSetSelectedRepositoryId).not.toHaveBeenCalled();
    expect(failureSetLoading).not.toHaveBeenCalled();
    expect(failureSetError).not.toHaveBeenCalled();
  });
});
