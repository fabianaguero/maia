import { describe, expect, it, vi } from "vitest";

import {
  buildCatalogBooleanNoticeAction,
  buildCatalogNamedResultAction,
  buildCatalogPlaylistDeleteAction,
  buildCatalogPlaylistSaveAction,
  buildCatalogRelinkMissingTracksAction,
  buildCatalogRepositoryDeleteAction,
  buildCatalogRepositoryReanalyzeAction,
  buildCatalogTrackAnalysisUpdateAction,
  buildCatalogTrackDeleteAction,
  buildCatalogTrackPerformanceUpdateAction,
  buildCatalogTrackReanalyzeAction,
  buildCatalogTrackRelinkAction,
  buildCatalogUpdateNoticeAction,
  runCatalogBooleanAction,
  runCatalogResultAction,
  runCatalogUpdateAction,
} from "../../src/hooks/appCatalogLibraryActionsRuntime";
import { en } from "../../src/i18n/en";

describe("appCatalogLibraryActionsRuntime", () => {
  it("handles result actions for success, empty and error cases", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogResultAction({
        task: async () => ({ name: "Track" }),
        onSuccess: (result) => ({ tone: "success", title: "ok", body: result.name }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(true);

    await expect(
      runCatalogResultAction({
        task: async () => null,
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onEmpty: () => ({ tone: "info", title: "empty", body: "nope" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    await expect(
      runCatalogResultAction({
        task: async () => {
          throw new Error("broken");
        },
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).toHaveBeenCalledWith("success", "ok", "Track");
    expect(notify).toHaveBeenCalledWith("info", "empty", "nope");
    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("broken"));
  });

  it("returns false for empty result actions without emitting a notice when onEmpty is missing", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogResultAction({
        task: async () => null,
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).not.toHaveBeenCalled();
  });

  it("handles boolean and update actions", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogBooleanAction({
        task: async () => true,
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(true);

    await expect(
      runCatalogBooleanAction({
        task: async () => false,
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    await expect(
      runCatalogUpdateAction({
        task: async () => null,
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
      }),
    ).resolves.toBeUndefined();

    await expect(
      runCatalogUpdateAction({
        task: async () => {
          throw new Error("update broke");
        },
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
      }),
    ).resolves.toBeUndefined();

    await expect(
      runCatalogUpdateAction({
        task: async () => ({ id: "updated" }),
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
      }),
    ).resolves.toBeUndefined();

    expect(notify).toHaveBeenCalledWith("success", "deleted", "done");
    expect(notify).toHaveBeenCalledWith("error", "missing", "not found");
    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("update broke"));
  });

  it("reports thrown errors for boolean actions", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogBooleanAction({
        task: async () => {
          throw new Error("delete broke");
        },
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("delete broke"));
  });

  it("builds generic named, boolean and update action payloads", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogResultAction(
        buildCatalogNamedResultAction({
          task: async () => ({ name: "Deck A" }),
          resolveName: (result) => result.name,
          successTitle: "saved",
          successBodyTemplate: "Saved {title}",
          errorTitle: "failed",
          notify,
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      runCatalogBooleanAction(
        buildCatalogBooleanNoticeAction({
          task: async () => true,
          successTitle: "deleted",
          successBody: "done",
          errorTitle: "failed",
          notify,
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      runCatalogUpdateAction(
        buildCatalogUpdateNoticeAction({
          task: async () => null,
          notify,
          missingTitle: "missing",
          missingBody: "not found",
          errorTitle: "failed",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(notify).toHaveBeenCalledWith("success", "saved", "Saved Deck A");
    expect(notify).toHaveBeenCalledWith("success", "deleted", "done");
    expect(notify).toHaveBeenCalledWith("error", "missing", "not found");
  });

  it("builds catalog action payloads with the expected tasks and notices", async () => {
    const notify = vi.fn();
    const library = {
      reanalyzeTrack: vi.fn(async () => ({ tags: { title: "Track A" } })),
      relinkTrack: vi.fn(async () => ({ tags: { title: "Track B" } })),
      relinkMissingTracksFromDirectory: vi.fn(async () => ({
        relinkedTracks: [{ id: "track-1" }],
        unresolvedTrackIds: ["track-2"],
      })),
      deleteLibraryTrack: vi.fn(async () => true),
      updateTrackPerformance: vi.fn(async () => null),
      updateTrackAnalysis: vi.fn(async () => null),
      savePlaylist: vi.fn(async () => ({ name: "Night Set" })),
      deletePlaylist: vi.fn(async () => true),
    };
    const repositories = {
      reanalyzeRepository: vi.fn(async () => ({ title: "Repo A" })),
      deleteLibraryRepository: vi.fn(async () => true),
    };

    await expect(
      runCatalogResultAction(
        buildCatalogTrackReanalyzeAction({ library, trackId: "track-1", t: en, notify }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogResultAction(
        buildCatalogTrackRelinkAction({ library, trackId: "track-2", t: en, notify }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogResultAction(buildCatalogRelinkMissingTracksAction({ library, t: en, notify })),
    ).resolves.toBe(true);
    await expect(
      runCatalogResultAction(
        buildCatalogRepositoryReanalyzeAction({
          repositories,
          repositoryId: "repo-1",
          t: en,
          notify,
        }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogBooleanAction(
        buildCatalogTrackDeleteAction({ library, trackId: "track-3", t: en, notify }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogBooleanAction(
        buildCatalogRepositoryDeleteAction({
          repositories,
          repositoryId: "repo-2",
          t: en,
          notify,
        }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogBooleanAction(
        buildCatalogPlaylistDeleteAction({ library, playlistId: "playlist-1", t: en, notify }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogResultAction(
        buildCatalogPlaylistSaveAction({
          library,
          playlistInput: { name: "Night Set", trackIds: [] },
          t: en,
          notify,
        }),
      ),
    ).resolves.toBe(true);
    await expect(
      runCatalogUpdateAction(
        buildCatalogTrackPerformanceUpdateAction({
          library,
          trackId: "track-4",
          performanceInput: { rating: 4 } as never,
          t: en,
          notify,
        }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      runCatalogUpdateAction(
        buildCatalogTrackAnalysisUpdateAction({
          library,
          trackId: "track-5",
          analysisInput: { bpm: 126 } as never,
          t: en,
          notify,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(library.reanalyzeTrack).toHaveBeenCalledWith("track-1");
    expect(library.relinkTrack).toHaveBeenCalledWith("track-2");
    expect(repositories.reanalyzeRepository).toHaveBeenCalledWith("repo-1");
    expect(library.deleteLibraryTrack).toHaveBeenCalledWith("track-3");
    expect(repositories.deleteLibraryRepository).toHaveBeenCalledWith("repo-2");
    expect(library.deletePlaylist).toHaveBeenCalledWith("playlist-1");
    expect(library.savePlaylist).toHaveBeenCalledWith({ name: "Night Set", trackIds: [] });
    expect(library.updateTrackPerformance).toHaveBeenCalledWith("track-4", { rating: 4 });
    expect(library.updateTrackAnalysis).toHaveBeenCalledWith("track-5", { bpm: 126 });
  });
});
