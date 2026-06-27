import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppCatalogActions } from "../../src/hooks/useAppCatalogActions";
import { en } from "../../src/i18n/en";

describe("useAppCatalogActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

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
        importLibraryTrack: vi.fn(async () => ({
          id: "track-1",
          tags: { title: "Track 1" },
        })),
        reanalyzeTrack: vi.fn(),
        relinkTrack: vi.fn(),
        relinkMissingTracksFromDirectory: vi.fn(async () => ({
          relinkedTracks: [{ id: "track-1" }],
          unresolvedTrackIds: ["track-2", "track-3"],
        })),
        deleteLibraryTrack: vi.fn(),
        updateTrackPerformance: vi.fn(),
        updateTrackAnalysis: vi.fn(),
        savePlaylist: vi.fn(),
        deletePlaylist: vi.fn(),
      },
      repositories: {
        importRepositorySource: vi.fn(),
        reanalyzeRepository: vi.fn(),
        deleteLibraryRepository: vi.fn(),
      },
      baseAssets: {
        importLibraryBaseAsset: vi.fn(),
      },
      compositions: {
        importLibraryComposition: vi.fn(),
      },
    };
  }

  it("handles successful track import and clears the temporary highlight", async () => {
    const input = createInput();
    const { result } = renderHook(() => useAppCatalogActions(input));

    await act(async () => {
      await result.current.handleImportTrack({
        sourcePath: "/music/track-1.wav",
        label: "Track 1",
        musicStyleId: "house",
      });
    });

    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackImportedTitle,
      expect.stringContaining("Track 1"),
    );
    expect(input.setNewlyImportedId).toHaveBeenCalledWith("track-1");
    expect(input.setAnalysisMode).toHaveBeenCalledWith("track");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(input.setNewlyImportedId).toHaveBeenLastCalledWith(null);
  });

  it("reports partial missing-track relinks with resolved and unresolved counts", async () => {
    const input = createInput();
    const { result } = renderHook(() => useAppCatalogActions(input));

    await act(async () => {
      await result.current.handleRelinkMissingTracks();
    });

    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.missingTracksRelinkedTitle,
      expect.stringContaining("1"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.missingTracksRelinkedTitle,
      expect.stringContaining("2"),
    );
  });
});
