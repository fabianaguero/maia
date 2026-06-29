import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppCatalogLibraryActions } from "../../src/hooks/useAppCatalogLibraryActions";
import { en } from "../../src/i18n/en";
import type {
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../src/types/library";

function createInput() {
  const notify = vi.fn();

  return {
    notify,
    t: en,
    library: {
      reanalyzeTrack: vi.fn(async (trackId: string) =>
        trackId === "track-ok"
          ? {
              id: trackId,
              tags: { title: "Track OK" },
            }
          : null,
      ),
      relinkTrack: vi.fn(async (trackId: string) =>
        trackId === "track-link"
          ? {
              id: trackId,
              tags: { title: "Track Linked" },
            }
          : null,
      ),
      relinkMissingTracksFromDirectory: vi.fn(async () => ({
        relinkedTracks: [{ id: "track-1" }],
        unresolvedTrackIds: ["track-2"],
      })),
      deleteLibraryTrack: vi.fn(async (trackId: string) => trackId === "track-delete"),
      updateTrackPerformance: vi.fn(async (trackId: string) =>
        trackId === "track-performance" ? { id: trackId } : null,
      ),
      updateTrackAnalysis: vi.fn(async (trackId: string) =>
        trackId === "track-analysis" ? { id: trackId } : null,
      ),
      savePlaylist: vi.fn(async (input: SaveBaseTrackPlaylistInput) =>
        input.name === "House Set"
          ? {
              id: "playlist-1",
              name: input.name,
              trackIds: [],
              createdAt: "2026-06-29T10:00:00.000Z",
              updatedAt: "2026-06-29T10:00:00.000Z",
            }
          : null,
      ),
      deletePlaylist: vi.fn(async (playlistId: string) => playlistId === "playlist-delete"),
    },
    repositories: {
      reanalyzeRepository: vi.fn(async (repositoryId: string) =>
        repositoryId === "repo-ok"
          ? {
              id: repositoryId,
              title: "Repo OK",
            }
          : null,
      ),
      deleteLibraryRepository: vi.fn(async (repositoryId: string) => repositoryId === "repo-delete"),
    },
  };
}

describe("useAppCatalogLibraryActions", () => {
  it("reports successful track and repository actions", async () => {
    const input = createInput();
    const { result } = renderHook(() => useAppCatalogLibraryActions(input));

    await act(async () => {
      await expect(result.current.handleReanalyzeTrack("track-ok")).resolves.toBe(true);
      await expect(result.current.handleRelinkTrack("track-link")).resolves.toBe(true);
      await expect(result.current.handleRelinkMissingTracks()).resolves.toBe(true);
      await expect(result.current.handleReanalyzeRepository("repo-ok")).resolves.toBe(true);
      await expect(result.current.handleDeleteTrack("track-delete")).resolves.toBe(true);
      await expect(result.current.handleDeleteRepository("repo-delete")).resolves.toBe(true);
      await expect(
        result.current.handleSavePlaylist({ name: "House Set", trackIds: [] }),
      ).resolves.toBe(true);
      await expect(result.current.handleDeletePlaylist("playlist-delete")).resolves.toBe(true);
    });

    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.reanalysisCompleteTitle,
      expect.stringContaining("Track OK"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackRelinkedTitle,
      expect.stringContaining("Track Linked"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.missingTracksRelinkedTitle,
      expect.stringContaining("1"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.reanalysisCompleteTitle,
      expect.stringContaining("Repo OK"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackDeletedTitle,
      en.appShell.trackDeletedBody,
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.repositoryDeletedTitle,
      en.appShell.repositoryDeletedBody,
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.playlistSavedTitle,
      expect.stringContaining("House Set"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "success",
      en.appShell.playlistDeletedTitle,
      en.appShell.playlistDeletedBody,
    );
  });

  it("returns false when actions complete without a result", async () => {
    const input = createInput();
    input.library.relinkMissingTracksFromDirectory.mockResolvedValueOnce({
      relinkedTracks: [],
      unresolvedTrackIds: [],
    });
    const { result } = renderHook(() => useAppCatalogLibraryActions(input));

    await act(async () => {
      await expect(result.current.handleReanalyzeTrack("track-missing")).resolves.toBe(false);
      await expect(result.current.handleRelinkTrack("track-missing")).resolves.toBe(false);
      await expect(result.current.handleRelinkMissingTracks()).resolves.toBe(true);
      await expect(result.current.handleReanalyzeRepository("repo-missing")).resolves.toBe(false);
      await expect(result.current.handleDeleteTrack("track-missing")).resolves.toBe(false);
      await expect(result.current.handleDeleteRepository("repo-missing")).resolves.toBe(false);
      await expect(
        result.current.handleSavePlaylist({ name: "Empty Set", trackIds: [] }),
      ).resolves.toBe(false);
      await expect(result.current.handleDeletePlaylist("playlist-missing")).resolves.toBe(false);
    });

    const performanceInput = { color: "cyan", rating: 5 } as UpdateTrackPerformanceInput;
    const analysisInput = { bpm: 128 } as UpdateTrackAnalysisInput;
    await act(async () => {
      await result.current.handleUpdateTrackPerformance("track-missing", performanceInput);
      await result.current.handleUpdateTrackAnalysis("track-missing", analysisInput);
    });

    expect(input.notify).toHaveBeenCalledWith(
      "info",
      en.appShell.noMatchesFoundTitle,
      en.appShell.noMatchesFoundBody,
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.trackUpdateFailedTitle,
      en.appShell.trackUpdateFailedBody,
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.beatGridUpdateFailedTitle,
      en.appShell.beatGridUpdateFailedBody,
    );
  });

  it("reports thrown errors for all handlers", async () => {
    const input = createInput();
    input.library.reanalyzeTrack.mockRejectedValueOnce(new Error("track reanalyze boom"));
    input.library.relinkTrack.mockRejectedValueOnce(new Error("track relink boom"));
    input.library.relinkMissingTracksFromDirectory.mockRejectedValueOnce(
      new Error("bulk relink boom"),
    );
    input.repositories.reanalyzeRepository.mockRejectedValueOnce(new Error("repo boom"));
    input.library.deleteLibraryTrack.mockRejectedValueOnce(new Error("delete track boom"));
    input.repositories.deleteLibraryRepository.mockRejectedValueOnce(
      new Error("delete repo boom"),
    );
    input.library.updateTrackPerformance.mockRejectedValueOnce(new Error("perf boom"));
    input.library.updateTrackAnalysis.mockRejectedValueOnce(new Error("analysis boom"));
    input.library.savePlaylist.mockRejectedValueOnce(new Error("save playlist boom"));
    input.library.deletePlaylist.mockRejectedValueOnce(new Error("delete playlist boom"));

    const { result } = renderHook(() => useAppCatalogLibraryActions(input));

    await act(async () => {
      await expect(result.current.handleReanalyzeTrack("track-ok")).resolves.toBe(false);
      await expect(result.current.handleRelinkTrack("track-link")).resolves.toBe(false);
      await expect(result.current.handleRelinkMissingTracks()).resolves.toBe(false);
      await expect(result.current.handleReanalyzeRepository("repo-ok")).resolves.toBe(false);
      await expect(result.current.handleDeleteTrack("track-delete")).resolves.toBe(false);
      await expect(result.current.handleDeleteRepository("repo-delete")).resolves.toBe(false);
      await result.current.handleUpdateTrackPerformance(
        "track-performance",
        { color: "red" } as UpdateTrackPerformanceInput,
      );
      await result.current.handleUpdateTrackAnalysis(
        "track-analysis",
        { bpm: 124 } as UpdateTrackAnalysisInput,
      );
      await expect(
        result.current.handleSavePlaylist({ name: "House Set", trackIds: [] }),
      ).resolves.toBe(false);
      await expect(result.current.handleDeletePlaylist("playlist-delete")).resolves.toBe(false);
    });

    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.reanalysisFailedTitle,
      expect.stringContaining("track reanalyze boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.relinkFailedTitle,
      expect.stringContaining("track relink boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.bulkRelinkFailedTitle,
      expect.stringContaining("bulk relink boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.deleteFailedTitle,
      expect.stringContaining("delete track boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.trackUpdateFailedTitle,
      expect.stringContaining("perf boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.beatGridUpdateFailedTitle,
      expect.stringContaining("analysis boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.playlistSaveFailedTitle,
      expect.stringContaining("save playlist boom"),
    );
    expect(input.notify).toHaveBeenCalledWith(
      "error",
      en.appShell.playlistDeleteFailedTitle,
      expect.stringContaining("delete playlist boom"),
    );
  });
});
