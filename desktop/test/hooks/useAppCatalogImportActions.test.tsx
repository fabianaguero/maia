import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppCatalogImportActions } from "../../src/hooks/useAppCatalogImportActions";
import { en } from "../../src/i18n/en";

const state = vi.hoisted(() => ({
  discoverRepositoryLogs: vi.fn(async () => []),
  buildDiscoveredLogImportInputs: vi.fn(() => []),
}));

vi.mock("../../src/api/repositories", () => ({
  discoverRepositoryLogs: state.discoverRepositoryLogs,
}));

vi.mock("../../src/appRuntime", () => ({
  buildDiscoveredLogImportInputs: state.buildDiscoveredLogImportInputs,
}));

function createInput() {
  const notify = vi.fn();
  const setNewlyImportedId = vi.fn();
  const setAnalysisMode = vi.fn();
  const setScreen = vi.fn();

  return {
    notify,
    setNewlyImportedId,
    setAnalysisMode,
    setScreen,
    t: en,
    library: {
      importLibraryTrack: vi.fn(async (input: { label?: string }) =>
        input.label === "Track OK"
          ? {
              id: "track-1",
              tags: { title: "Track OK" },
            }
          : null,
      ),
    },
    repositories: {
      importRepositorySource: vi.fn(async (input: { label?: string; sourceKind?: string }) =>
        input.label === "Repo OK"
          ? {
              id: "repo-1",
              title: "Repo OK",
            }
          : input.label === "Rescued Log A" || input.label === "Rescued Log B"
            ? {
                id: input.label.toLowerCase().replace(/\s+/g, "-"),
                title: input.label,
              }
            : null,
      ),
    },
    baseAssets: {
      importLibraryBaseAsset: vi.fn(async (input: { title?: string }) =>
        input.title === "Base OK"
          ? {
              id: "base-1",
              title: "Base OK",
            }
          : null,
      ),
    },
    compositions: {
      importLibraryComposition: vi.fn(async (input: { title?: string }) =>
        input.title === "Composition OK"
          ? {
              title: "Composition OK",
            }
          : null,
      ),
    },
  };
}

describe("useAppCatalogImportActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.discoverRepositoryLogs.mockReset();
    state.buildDiscoveredLogImportInputs.mockReset();
    state.discoverRepositoryLogs.mockResolvedValue([]);
    state.buildDiscoveredLogImportInputs.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("handles successful track, base asset, and composition imports", async () => {
    const input = createInput();
    const { result } = renderHook(() => useAppCatalogImportActions(input));

    await act(async () => {
      await expect(
        result.current.handleImportTrack({
          sourcePath: "/music/track.wav",
          label: "Track OK",
          musicStyleId: "house",
        }),
      ).resolves.toBe(true);
      await expect(
        result.current.handleImportBaseAsset({
          title: "Base OK",
          category: "drums",
          sourcePath: "/bases/base.wav",
        }),
      ).resolves.toBe(true);
      await expect(
        result.current.handleImportComposition({
          title: "Composition OK",
          sourcePath: "/compositions/comp.json",
        }),
      ).resolves.toBe(true);
    });

    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackImportedTitle,
      expect.stringContaining("Track OK"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.assetImportedTitle,
      expect.stringContaining("Base OK"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.compositionReadyTitle,
      expect.stringContaining("Composition OK"),
    );
    expect(input.setAnalysisMode).toHaveBeenCalledWith("track");
    expect(input.setAnalysisMode).toHaveBeenCalledWith("base");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(input.setNewlyImportedId).toHaveBeenCalledWith("track-1");
    expect(input.setNewlyImportedId).toHaveBeenCalledWith("base-1");
    expect(input.setNewlyImportedId).toHaveBeenCalledWith(null);
  });

  it("imports repositories and schedules discovered log rescues for directories", async () => {
    const input = createInput();
    state.discoverRepositoryLogs.mockResolvedValueOnce([
      "/logs/services-a.log",
      "/logs/services-b.log",
    ]);
    state.buildDiscoveredLogImportInputs.mockReturnValueOnce([
      { sourcePath: "/logs/services-a.log", label: "Rescued Log A", sourceKind: "file" },
      { sourcePath: "/logs/services-b.log", label: "Rescued Log B", sourceKind: "file" },
    ]);

    const { result } = renderHook(() => useAppCatalogImportActions(input));

    await act(async () => {
      await expect(
        result.current.handleImportRepository({
          sourcePath: "/repos/services",
          label: "Repo OK",
          sourceKind: "directory",
        }),
      ).resolves.toBe(true);
    });

    expect(state.discoverRepositoryLogs).toHaveBeenCalledWith("/repos/services");
    expect(state.buildDiscoveredLogImportInputs).toHaveBeenCalledWith([
      "/logs/services-a.log",
      "/logs/services-b.log",
    ]);
    expect(input.repositories.importRepositorySource).toHaveBeenCalledTimes(3);
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.repositoryConnectedTitle,
      expect.stringContaining("Repo OK"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.repositoryConnectedTitle,
      expect.stringContaining("2"),
    );
    expect(input.setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");
  });

  it("returns false and reports import errors or null results", async () => {
    const input = createInput();
    input.library.importLibraryTrack.mockResolvedValueOnce(null);
    input.baseAssets.importLibraryBaseAsset.mockRejectedValueOnce(new Error("base import boom"));
    input.compositions.importLibraryComposition.mockRejectedValueOnce(
      new Error("composition boom"),
    );
    input.repositories.importRepositorySource.mockRejectedValueOnce(new Error("repo boom"));

    const { result } = renderHook(() => useAppCatalogImportActions(input));

    await act(async () => {
      await expect(
        result.current.handleImportTrack({
          sourcePath: "/music/missing.wav",
          label: "Missing Track",
          musicStyleId: "house",
        }),
      ).resolves.toBe(false);
      await expect(
        result.current.handleImportRepository({
          sourcePath: "/repos/broken",
          label: "Repo Broken",
          sourceKind: "file",
        }),
      ).resolves.toBe(false);
      await expect(
        result.current.handleImportBaseAsset({
          title: "Base Broken",
          category: "drums",
          sourcePath: "/bases/broken.wav",
        }),
      ).resolves.toBe(false);
      await expect(
        result.current.handleImportComposition({
          title: "Composition Broken",
          sourcePath: "/compositions/broken.json",
        }),
      ).resolves.toBe(false);
    });

    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.connectionFailedTitle,
      expect.stringContaining("repo boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.assetImportFailedTitle,
      expect.stringContaining("base import boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.compositionFailedTitle,
      expect.stringContaining("composition boom"),
    );
  });
});
