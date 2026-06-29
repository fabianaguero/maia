import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: vi.fn(() => false),
}));

import {
  deleteBaseTrackPlaylist,
  listPlaylists,
  pickTrackSourceDirectory,
  resolveMissingTracksFromDirectory,
  saveBaseTrackPlaylist,
  seedDemoTracks,
  updateTrackAnalysis,
  updateTrackPerformance,
  updateTrackSource,
} from "../../src/api/library";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RelinkMissingTracksResult,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
  UpdateTrackSourceInput,
} from "../../src/types/library";

function enableNativeBridge(): void {
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
}

function disableNativeBridge(): void {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

describe("library api", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    enableNativeBridge();
  });

  afterEach(() => {
    disableNativeBridge();
    vi.restoreAllMocks();
  });

  it("passes playlist, directory, and track mutation calls through to the native bridge", async () => {
    const playlistInput: SaveBaseTrackPlaylistInput = {
      name: "Night drive",
      trackIds: ["track-1"],
    };
    const playlist: BaseTrackPlaylist = {
      id: "playlist-1",
      name: "Night drive",
      trackIds: ["track-1"],
      createdAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-29T00:00:00.000Z",
    };
    const updatedTrack: LibraryTrack = {
      id: "track-1",
      title: "Pulse",
      artist: null,
      bpm: 126,
      sourcePath: "/tracks/pulse.wav",
      storagePath: "/tracks/pulse.wav",
      musicStyleId: "house",
      importedAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-29T00:00:00.000Z",
      coverArtPath: null,
      waveformPath: null,
      cuePointsJson: "[]",
      loopRegionsJson: "[]",
      energyMarkersJson: "[]",
      performanceNotes: null,
      analysisSummary: null,
      sourceTemplateId: null,
      sourceTemplateLabel: null,
      sourceTemplateBpm: null,
    };
    const analysisInput: UpdateTrackAnalysisInput = {
      bpm: 126,
      cuePointsJson: '[{"start":12}]',
    };
    const performanceInput: UpdateTrackPerformanceInput = {
      performanceNotes: "Lift here",
      loopRegionsJson: '[{"start":32}]',
      energyMarkersJson: '[{"bar":64}]',
    };
    const sourceInput: UpdateTrackSourceInput = {
      sourcePath: "/tracks/pulse-v2.wav",
    };
    const relinkResult: RelinkMissingTracksResult = {
      relinkedTracks: [updatedTrack],
      unresolvedTrackIds: [],
    };

    invokeMock
      .mockResolvedValueOnce([playlist])
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("/music/sets")
      .mockResolvedValueOnce(updatedTrack)
      .mockResolvedValueOnce(updatedTrack)
      .mockResolvedValueOnce(updatedTrack)
      .mockResolvedValueOnce(relinkResult);

    await expect(listPlaylists()).resolves.toEqual([playlist]);
    await expect(saveBaseTrackPlaylist(playlistInput)).resolves.toEqual(playlist);
    await expect(deleteBaseTrackPlaylist(playlist.id)).resolves.toBeUndefined();
    await expect(pickTrackSourceDirectory("  /music/sets  ")).resolves.toBe("/music/sets");
    await expect(updateTrackPerformance(updatedTrack.id, performanceInput)).resolves.toEqual(
      updatedTrack,
    );
    await expect(updateTrackAnalysis(updatedTrack.id, analysisInput)).resolves.toEqual(
      updatedTrack,
    );
    await expect(updateTrackSource(updatedTrack.id, sourceInput)).resolves.toEqual(updatedTrack);
    await expect(resolveMissingTracksFromDirectory("/library/fixes")).resolves.toEqual(
      relinkResult,
    );

    expect(invokeMock).toHaveBeenNthCalledWith(1, "list_playlists", undefined);
    expect(invokeMock).toHaveBeenNthCalledWith(2, "save_playlist", { input: playlistInput });
    expect(invokeMock).toHaveBeenNthCalledWith(3, "delete_playlist", {
      playlistId: playlist.id,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(4, "pick_track_source_directory", {
      initialPath: "/music/sets",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(5, "update_track_performance", {
      trackId: updatedTrack.id,
      input: performanceInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(6, "update_track_analysis", {
      trackId: updatedTrack.id,
      input: analysisInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(7, "update_track_source", {
      trackId: updatedTrack.id,
      input: sourceInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(8, "resolve_missing_tracks_from_directory", {
      directoryPath: "/library/fixes",
    });
  });

  it("uses fallback behavior when the native bridge is unavailable", async () => {
    disableNativeBridge();

    const [seededTrack] = await seedDemoTracks();
    const playlist = await saveBaseTrackPlaylist({
      name: "Fallback playlist",
      trackIds: [seededTrack.id],
    });
    const updatedTrack = await updateTrackSource(seededTrack.id, {
      sourcePath: "/fallback/path/fixed.wav",
    });

    await expect(listPlaylists()).resolves.toEqual([playlist]);
    await expect(deleteBaseTrackPlaylist(playlist.id)).resolves.toBeUndefined();
    await expect(pickTrackSourceDirectory(" /fallback/path ")).resolves.toBeNull();
    expect(updatedTrack.sourcePath).toBe("/fallback/path/fixed.wav");
    await expect(resolveMissingTracksFromDirectory("/fallback/path")).resolves.toEqual({
      relinkedTracks: [],
      unresolvedTrackIds: [],
    });
  });
});
