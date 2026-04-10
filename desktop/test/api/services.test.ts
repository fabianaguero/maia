import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(async () => {
    throw new Error("Tauri native bridge unavailable");
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

import {
  importBaseAsset,
  listBaseAssets,
  pickBaseAssetPath,
} from "../../src/api/baseAssets";
import {
  importComposition,
  listCompositions,
} from "../../src/api/compositions";
import {
  checkTrackExists,
  deleteTrack,
  importTrack,
  listTracks,
  pickTrackSourcePath,
  seedDemoTracks,
} from "../../src/api/library";
import {
  checkRepositoryExists,
  deleteRepository,
  importRepository,
  listRepositories,
  pickExportSavePath,
  pickRepositoryDirectory,
  pickRepositoryFile,
  pickStemsExportDirectory,
  pollLogStream,
} from "../../src/api/repositories";
import {
  createPersistedSession,
  deleteSessionBookmark,
  listSessionBookmarks,
  listPersistedSessions,
  listSessionEvents,
  upsertSessionBookmark,
  type PersistedSession,
  type SessionBookmark,
} from "../../src/api/sessions";

describe("desktop service wrappers", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockImplementation(async () => {
      throw new Error("Tauri native bridge unavailable");
    });
    window.localStorage.clear();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    vi.restoreAllMocks();
  });

  it("retries native list calls before falling back to browser mocks", async () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Tauri");

    const nativeTracks = [{ id: "native-track-1", title: "Native Track" }] as any[];
    let attempts = 0;

    invokeMock.mockImplementation(async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error("Tauri native bridge unavailable");
      }

      return nativeTracks;
    });

    window.setTimeout(() => {
      (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    }, 20);

    const pendingTracks = listTracks();
    await vi.advanceTimersByTimeAsync(120);

    await expect(pendingTracks).resolves.toEqual(nativeTracks);
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the mock track library when Tauri is unavailable", async () => {
    const track = await importTrack({
      title: "Fallback Track",
      sourcePath: "/tmp/fallback-track.wav",
      musicStyleId: "house",
    });

    expect(track.storagePath).toContain("browser-fallback://tracks/");
    await expect(listTracks()).resolves.toEqual([track]);
    await expect(seedDemoTracks()).resolves.toHaveLength(1);
    await expect(pickTrackSourcePath("/tmp")).resolves.toBeNull();
    await expect(checkTrackExists("/tmp/fallback-track.wav")).resolves.toBe(true);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(deleteTrack(track.id)).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith("Mock delete track:", track.id);
  });

  it("falls back to browser-managed base assets when importing without Tauri", async () => {
    const baseAsset = await importBaseAsset({
      sourceKind: "directory",
      sourcePath: "/tmp/base-pack",
      categoryId: "drum-kit",
      reusable: true,
    });

    expect(baseAsset.categoryId).toBe("drum-kit");
    expect(baseAsset.metrics.storageMode).toBe("browser-fallback");
    await expect(listBaseAssets()).resolves.toEqual([baseAsset]);
    await expect(pickBaseAssetPath("directory", "/tmp")).resolves.toBeNull();
  });

  it("falls back to mock repository analysis and live log polling", async () => {
    const repository = await importRepository({
      sourceKind: "file",
      sourcePath: "/var/log/maia/system.log",
    });

    expect(repository.sourceKind).toBe("file");
    expect(repository.primaryLanguage).toBe("logs");
    expect(repository.metrics.storageMode).toBe("browser-fallback");
    await expect(listRepositories()).resolves.toEqual([repository]);

    const liveWindow = await pollLogStream(repository.sourcePath);
    expect(liveWindow.hasData).toBe(true);
    expect(liveWindow.lineCount).toBeGreaterThan(0);
    expect(liveWindow.topComponents.length).toBeGreaterThan(0);

    await expect(pickRepositoryDirectory("/srv")).resolves.toBeNull();
    await expect(pickRepositoryFile("/srv")).resolves.toBeNull();
    await expect(pickExportSavePath("demo.wav")).resolves.toBeNull();
    await expect(pickStemsExportDirectory()).resolves.toBeNull();
    await expect(checkRepositoryExists(repository.sourcePath)).resolves.toBe(true);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(deleteRepository(repository.id)).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Mock delete repository:",
      repository.id,
    );
  });

  it("creates composition previews in the browser fallback path", async () => {
    const baseAsset = await importBaseAsset({
      sourceKind: "file",
      sourcePath: "/tmp/texture-loop.wav",
      categoryId: "pad-texture",
      reusable: true,
    });

    const composition = await importComposition({
      baseAssetId: baseAsset.id,
      referenceType: "manual",
      manualBpm: 124,
      label: "Texture Sketch",
    });

    expect(composition.referenceType).toBe("manual");
    expect(composition.referenceTitle).toBe("Manual 124 BPM");
    expect(composition.previewAudioPath).toContain("preview.wav");
    expect(composition.exportPath).toContain("plan.json");
    await expect(listCompositions()).resolves.toEqual([composition]);
  });

  it("returns safe fallbacks for session listing and events without Tauri", async () => {
    await expect(listPersistedSessions()).resolves.toEqual([]);
    await expect(listSessionEvents("session-1")).resolves.toEqual([]);
    await expect(listSessionBookmarks("session-1")).resolves.toEqual([]);
    await expect(
      upsertSessionBookmark({
        sessionId: "session-1",
        replayWindowIndex: 3,
        label: "Window 3",
        note: "Watch this spike",
      }),
    ).resolves.toBeNull();
    await expect(deleteSessionBookmark(1)).resolves.toBe(false);
  });

  it("passes persisted session creation through to the native layer when available", async () => {
    const session: PersistedSession = {
      id: "session-1",
      label: "Live monitor",
      sourceId: "repo-1",
      sourceTitle: "API logs",
      sourcePath: "/var/log/app.log",
      sourceKind: "file",
      trackId: "track-1",
      trackTitle: "Pulse",
      adapterKind: "file",
      mode: "live",
      status: "active",
      fileCursor: 128,
      totalPolls: 4,
      totalLines: 320,
      totalAnomalies: 3,
      lastBpm: 123,
      createdAt: "2026-04-08T12:00:00.000Z",
      updatedAt: "2026-04-08T12:03:00.000Z",
    };

    invokeMock.mockResolvedValueOnce(session);

    await expect(
      createPersistedSession({
        id: "session-1",
        label: "Live monitor",
        sourceId: "repo-1",
        trackId: "track-1",
        adapterKind: "file",
        mode: "live",
      }),
    ).resolves.toEqual(session);

    expect(invokeMock).toHaveBeenCalledWith("create_persisted_session", {
      input: {
        id: "session-1",
        label: "Live monitor",
        sourceId: "repo-1",
        trackId: "track-1",
        adapterKind: "file",
        mode: "live",
      },
    });
  });

  it("passes bookmark upserts through to the native layer when available", async () => {
    const bookmark: SessionBookmark = {
      id: 1,
      sessionId: "session-1",
      replayWindowIndex: 4,
      eventIndex: 37,
      label: "Deploy spike",
      note: "Good alert texture",
      bookmarkTag: "good-alerting",
      suggestedStyleProfileId: "alert-techno",
      suggestedMutationProfileId: "reactive",
      trackId: "track-1",
      trackTitle: "Pulse",
      trackSecond: 64.2,
      createdAt: "2026-04-09T12:00:00.000Z",
      updatedAt: "2026-04-09T12:01:00.000Z",
    };

    invokeMock.mockResolvedValueOnce(bookmark);

    await expect(
      upsertSessionBookmark({
        sessionId: "session-1",
        replayWindowIndex: 4,
        eventIndex: 37,
        label: "Deploy spike",
        note: "Good alert texture",
        bookmarkTag: "good-alerting",
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
        trackId: "track-1",
        trackTitle: "Pulse",
        trackSecond: 64.2,
      }),
    ).resolves.toEqual(bookmark);

    expect(invokeMock).toHaveBeenCalledWith("upsert_session_bookmark", {
      input: {
        sessionId: "session-1",
        replayWindowIndex: 4,
        eventIndex: 37,
        label: "Deploy spike",
        note: "Good alert texture",
        bookmarkTag: "good-alerting",
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
        trackId: "track-1",
        trackTitle: "Pulse",
        trackSecond: 64.2,
      },
    });
  });
});
