import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteMockPlaylist,
  importMockTrack,
  listMockTracks,
  listMockPlaylists,
  resolveMockMissingTracksFromDirectory,
  saveMockPlaylist,
  seedMockTracks,
  updateMockTrackAnalysis,
  updateMockTrackPerformance,
  updateMockTrackSource,
} from "../../src/api/mockLibrary";

describe("mock library storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("imports a track and persists enriched preview metadata", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "Night Circuit",
      sourcePath: "/tmp/night-circuit.wav",
      musicStyleId: "house",
    });

    expect(track.title).toBe("Night Circuit");
    expect(track.storagePath).toContain("browser-fallback://tracks/");
    expect(track.fileExtension).toBe(".wav");
    expect(track.musicStyleId).toBe("house");
    expect(track.keySignature).not.toBeNull();
    expect(track.energyLevel).not.toBeNull();
    expect(track.danceability).not.toBeNull();
    expect(track.structuralPatterns).toHaveLength(2);
    expect(track.file.playbackSource).toBe("unavailable");
    expect(track.tags.title).toBe("Night Circuit");
    expect(track.analysis.bpm).toBe(track.bpm);
    expect(track.performance.hotCues.length).toBeGreaterThan(0);

    await expect(listMockTracks()).resolves.toEqual([track]);
  });

  it("orders the most recently imported tracks first", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));
    await importMockTrack({
      title: "Older Track",
      sourcePath: "/tmp/older.wav",
      musicStyleId: "house",
    });

    vi.setSystemTime(new Date("2026-04-08T12:05:00Z"));
    await importMockTrack({
      title: "Newer Track",
      sourcePath: "/tmp/newer.wav",
      musicStyleId: "trance",
    });

    const tracks = await listMockTracks();

    expect(tracks.map((track) => track.title)).toEqual(["Newer Track", "Older Track"]);
  });

  it("seeds the browser fallback library only once", async () => {
    const firstSeed = await seedMockTracks();
    const secondSeed = await seedMockTracks();

    expect(firstSeed).toHaveLength(3);
    expect(secondSeed.map((track) => track.id)).toEqual(firstSeed.map((track) => track.id));
    await expect(listMockTracks()).resolves.toHaveLength(3);
  });

  it("rejects imports with an unknown music style", async () => {
    await expect(
      importMockTrack({
        title: "Broken Import",
        sourcePath: "/tmp/broken.wav",
        musicStyleId: "unknown-style",
      }),
    ).rejects.toThrow("Unknown music style");
  });

  it("persists performance edits in the browser fallback store", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "Performance Edit",
      sourcePath: "/tmp/performance-edit.wav",
      musicStyleId: "house",
    });

    vi.setSystemTime(new Date("2026-04-08T12:05:00Z"));

    const updated = await updateMockTrackPerformance(track.id, {
      rating: 5,
      color: "#22d3ee",
      bpmLock: true,
      gridLock: true,
      markPlayed: true,
    });

    expect(updated.performance.rating).toBe(5);
    expect(updated.performance.color).toBe("#22d3ee");
    expect(updated.performance.bpmLock).toBe(true);
    expect(updated.performance.gridLock).toBe(true);
    expect(updated.performance.playCount).toBe(1);
    expect(updated.performance.lastPlayedAt).toBe("2026-04-08T12:05:00.000Z");

    const [persisted] = await listMockTracks();
    expect(persisted.performance.rating).toBe(5);
    expect(persisted.performance.playCount).toBe(1);
  });

  it("creates, sorts, updates, and deletes playlists with normalized track ids", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));
    const firstTrack = await importMockTrack({
      title: "Track A",
      sourcePath: "/tmp/track-a.wav",
      musicStyleId: "house",
    });

    vi.setSystemTime(new Date("2026-04-08T12:01:00Z"));
    const secondTrack = await importMockTrack({
      title: "Track B",
      sourcePath: "/tmp/track-b.wav",
      musicStyleId: "trance",
    });

    vi.setSystemTime(new Date("2026-04-08T12:02:00Z"));
    const firstPlaylist = await saveMockPlaylist({
      name: "Warmup",
      trackIds: [firstTrack.id, firstTrack.id, "missing-track"],
    });

    expect(firstPlaylist.name).toBe("Warmup");
    expect(firstPlaylist.trackIds).toEqual([firstTrack.id]);

    vi.setSystemTime(new Date("2026-04-08T12:03:00Z"));
    const updatedPlaylist = await saveMockPlaylist({
      id: firstPlaylist.id,
      name: "Peak Time",
      trackIds: [firstTrack.id, secondTrack.id],
    });

    expect(updatedPlaylist.id).toBe(firstPlaylist.id);
    expect(updatedPlaylist.name).toBe("Peak Time");
    expect(updatedPlaylist.trackIds).toEqual([firstTrack.id, secondTrack.id]);
    expect(updatedPlaylist.createdAt).toBe(firstPlaylist.createdAt);
    expect(updatedPlaylist.updatedAt).toBe("2026-04-08T12:03:00.000Z");

    vi.setSystemTime(new Date("2026-04-08T12:04:00Z"));
    const secondPlaylist = await saveMockPlaylist({
      name: "",
      trackIds: [secondTrack.id],
    });

    const playlists = await listMockPlaylists();
    expect(playlists.map((playlist) => playlist.id)).toEqual([secondPlaylist.id, updatedPlaylist.id]);
    expect(secondPlaylist.name).toBe("Base playlist");

    await deleteMockPlaylist(updatedPlaylist.id);
    await expect(listMockPlaylists()).resolves.toEqual([secondPlaylist]);
  });

  it("rejects playlist saves without any valid tracks", async () => {
    await expect(
      saveMockPlaylist({
        name: "Broken",
        trackIds: ["missing-track"],
      }),
    ).rejects.toThrow("Select at least one track");
  });

  it("updates track sources, validates relink input, and resolves missing tracks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "Relink Me",
      sourcePath: "/tmp/relink-me.wav",
      musicStyleId: "house",
    });

    await expect(updateMockTrackSource(track.id, { sourcePath: "   " })).rejects.toThrow(
      "Track source path is required.",
    );
    await expect(
      updateMockTrackSource("missing-track", { sourcePath: "/tmp/new-source.mp3" }),
    ).rejects.toThrow("Track not found");

    vi.setSystemTime(new Date("2026-04-08T12:10:00Z"));
    const updatedTrack = await updateMockTrackSource(track.id, {
      sourcePath: "/music/relocated/new-source.mp3",
    });

    expect(updatedTrack.sourcePath).toBe("/music/relocated/new-source.mp3");
    expect(updatedTrack.file.sourcePath).toBe("/music/relocated/new-source.mp3");
    expect(updatedTrack.file.fileExtension).toBe("mp3");
    expect(updatedTrack.file.availabilityState).toBe("available");
    expect(updatedTrack.file.playbackSource).toBe("source_file");
    expect(updatedTrack.file.modifiedAt).toBe("2026-04-08T12:10:00.000Z");
    expect(updatedTrack.analysis.importedAt).toBe(track.analysis.importedAt);

    await updateMockTrackPerformance(track.id, {
      color: "#ef4444",
    });
    const markedMissing = await updateMockTrackSource(track.id, {
      sourcePath: "/music/relocated/new-source.mp3",
    });
    expect(markedMissing.file.availabilityState).toBe("available");

    window.localStorage.setItem(
      "maia.library.tracks.v1",
      JSON.stringify([
        {
          ...markedMissing,
          file: {
            ...markedMissing.file,
            availabilityState: "missing",
          },
        },
      ]),
    );

    await expect(resolveMockMissingTracksFromDirectory()).resolves.toEqual({
      relinkedTracks: [],
      unresolvedTrackIds: [track.id],
    });
  });

  it("updates analysis fields with normalized beat and bpm data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "Analyze Me",
      sourcePath: "/tmp/analyze-me.wav",
      musicStyleId: "house",
    });

    vi.setSystemTime(new Date("2026-04-08T12:08:00Z"));

    const updated = await updateMockTrackAnalysis(track.id, {
      bpm: Number.NaN,
      beatGrid: [
        { index: 0, second: 0.5 },
        { index: "bad", second: 1.25 },
      ] as never,
      bpmCurve: [
        { second: 0, bpm: 124.5 },
        { second: "bad", bpm: 125 },
      ] as never,
    });

    expect(updated.analysis.bpm).toBeNull();
    expect(updated.bpm).toBeNull();
    expect(updated.analysis.beatGrid).toEqual([{ index: 0, second: 0.5 }]);
    expect(updated.beatGrid).toEqual([{ index: 0, second: 0.5 }]);
    expect(updated.analysis.bpmCurve).toEqual([{ second: 0, bpm: 124.5 }]);
    expect(updated.bpmCurve).toEqual([{ second: 0, bpm: 124.5 }]);
    expect(updated.analysis.analyzedAt).toBe("2026-04-08T12:08:00.000Z");

    await expect(updateMockTrackAnalysis("missing-track", {})).rejects.toThrow("Track not found");
  });

  it("normalizes persisted legacy track snapshots and derives fallback playback metadata", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    window.localStorage.setItem(
      "maia.library.tracks.v1",
      JSON.stringify([
        null,
        {
          id: "legacy-track",
          title: "Legacy Snapshot",
          sourcePath: "browser-fallback://tracks/legacy-track.wav",
          storagePath: "/managed/cache/legacy-track.wav",
          importedAt: "2026-04-08T11:00:00.000Z",
          bpm: 123,
          bpmConfidence: 0.77,
          durationSeconds: 240,
          waveformBins: [0.2, "bad", 0.6],
          beatGrid: [
            { index: 0, second: 0.25 },
            { index: "bad", second: 1.25 },
          ],
          bpmCurve: [
            { second: 0, bpm: 123 },
            { second: "bad", bpm: 122.5 },
          ],
          analyzerStatus: "Legacy ready",
          analysisMode: "legacy",
          musicStyleId: "house",
          structuralPatterns: [
            {
              type: "intro",
              start: 0,
              end: 16,
              confidence: 0.8,
              label: "Intro",
            },
            {
              type: "drop",
              start: 64,
              end: 96,
              confidence: 0.92,
              label: "Drop",
            },
            {
              type: "broken",
              start: "bad",
              end: 100,
              confidence: 0.5,
              label: "Broken",
            },
          ],
          fileExtension: "wav",
          file: {
            sizeBytes: 1024,
            modifiedAt: "2026-04-08T10:59:00.000Z",
            checksum: "abc123",
            availabilityState: "weird",
            playbackSource: "legacy",
          },
          tags: {
            title: "   ",
            artist: "Artist",
            album: "Album",
            genre: "House",
            year: 2026,
            comment: "Legacy comment",
            artworkPath: "/artwork.png",
          },
          analysis: {
            analyzerVersion: 42,
          },
          performance: {
            color: "#22d3ee",
            rating: 4,
            playCount: 2,
            lastPlayedAt: "2026-04-08T11:05:00.000Z",
            bpmLock: true,
            gridLock: true,
            mainCueSecond: "bad",
            hotCues: [{ second: "bad" }],
            memoryCues: [{ second: 32 }],
            savedLoops: [{ startSecond: 48, endSecond: 64 }],
          },
        },
      ]),
    );

    const [track] = await listMockTracks();

    expect(track.id).toBe("legacy-track");
    expect(track.waveformBins).toEqual([0.2, 0.6]);
    expect(track.beatGrid).toEqual([{ index: 0, second: 0.25 }]);
    expect(track.bpmCurve).toEqual([{ second: 0, bpm: 123 }]);
    expect(track.musicStyleLabel).toBe("House");
    expect(track.file.playbackSource).toBe("managed_snapshot");
    expect(track.file.availabilityState).toBe("available");
    expect(track.tags.title).toBe("Legacy Snapshot");
    expect(track.analysis.analyzerVersion).toBeNull();
    expect(track.analysis.analyzedAt).toBe("2026-04-08T11:00:00.000Z");
    expect(track.analysis.structuralPatterns).toEqual([
      {
        type: "intro",
        start: 0,
        end: 16,
        confidence: 0.8,
        label: "Intro",
      },
      {
        type: "drop",
        start: 64,
        end: 96,
        confidence: 0.92,
        label: "Drop",
      },
    ]);
    expect(track.performance.mainCueSecond).toBe(0.25);
    expect(track.performance.hotCues).toEqual([
      {
        id: "hot-cue-1",
        slot: 1,
        second: 0,
        label: "Intro",
        kind: "hot",
        color: "#f59e0b",
      },
      {
        id: "hot-cue-2",
        slot: 2,
        second: 64,
        label: "Drop",
        kind: "hot",
        color: "#22d3ee",
      },
    ]);
    expect(track.performance.memoryCues).toEqual([
      {
        id: "memory-cue-1",
        slot: null,
        second: 32,
        label: "memory cue 1",
        kind: "memory",
        color: null,
      },
    ]);
    expect(track.performance.savedLoops).toEqual([
      {
        id: "saved-loop-1",
        slot: null,
        startSecond: 48,
        endSecond: 64,
        label: "Loop 1",
        color: null,
        locked: false,
      },
    ]);
  });

  it("normalizes persisted playlists and ignores invalid browser storage snapshots", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "Playlist Anchor",
      sourcePath: "/tmp/playlist-anchor.wav",
      musicStyleId: "house",
    });

    window.localStorage.setItem(
      "maia.library.playlists.v1",
      JSON.stringify([
        null,
        {
          id: "",
          name: " ",
          trackIds: ["", track.id, "missing-track"],
          createdAt: "",
          updatedAt: "",
        },
      ]),
    );

    const [playlist] = await listMockPlaylists();

    expect(playlist.id).toMatch(/^playlist-/);
    expect(playlist.name).toBe("Base playlist");
    expect(playlist.trackIds).toEqual([track.id]);
    expect(playlist.createdAt).toBe("2026-04-08T12:00:00.000Z");
    expect(playlist.updatedAt).toBe("2026-04-08T12:00:00.000Z");

    window.localStorage.setItem("maia.library.tracks.v1", "{broken");
    window.localStorage.setItem("maia.library.playlists.v1", "{broken");

    await expect(listMockTracks()).resolves.toEqual([]);
    await expect(listMockPlaylists()).resolves.toEqual([]);
  });

  it("derives fallback titles, sorts edited cues, and preserves analysis lanes when omitted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));

    const track = await importMockTrack({
      title: "   ",
      sourcePath: "/tmp/no-extension-track",
      musicStyleId: "house",
    });

    expect(track.title).toBe("no-extension-track");
    expect(track.fileExtension).toBe(".audio");

    const updatedPerformance = await updateMockTrackPerformance(track.id, {
      rating: 8.8,
      color: "   ",
      mainCueSecond: null,
      hotCues: [
        { id: "cue-b", slot: 2, second: 48, label: "B", kind: "hot", color: "#22d3ee" },
        { id: "cue-a", slot: 1, second: 16, label: "A", kind: "hot", color: "#f59e0b" },
      ],
      memoryCues: [
        { id: "mem-b", slot: 2, second: 44, label: "Later", kind: "memory", color: null },
        { id: "mem-a", slot: 1, second: 12, label: "Earlier", kind: "memory", color: null },
      ],
      savedLoops: [
        {
          id: "loop-b",
          slot: 2,
          startSecond: 40,
          endSecond: 56,
          label: "Later",
          color: null,
          locked: false,
        },
        {
          id: "loop-a",
          slot: 1,
          startSecond: 8,
          endSecond: 24,
          label: "Earlier",
          color: "#ef4444",
          locked: true,
        },
      ],
    });

    expect(updatedPerformance.performance.rating).toBe(5);
    expect(updatedPerformance.performance.color).toBeNull();
    expect(updatedPerformance.performance.mainCueSecond).toBeNull();
    expect(updatedPerformance.performance.hotCues.map((cue) => cue.id)).toEqual([
      "cue-a",
      "cue-b",
    ]);
    expect(updatedPerformance.performance.memoryCues.map((cue) => cue.id)).toEqual([
      "mem-a",
      "mem-b",
    ]);
    expect(updatedPerformance.performance.savedLoops.map((loop) => loop.id)).toEqual([
      "loop-a",
      "loop-b",
    ]);

    const updatedAnalysis = await updateMockTrackAnalysis(track.id, {
      bpm: 128.5,
    });

    expect(updatedAnalysis.analysis.bpm).toBe(128.5);
    expect(updatedAnalysis.analysis.beatGrid).toEqual(track.analysis.beatGrid);
    expect(updatedAnalysis.analysis.bpmCurve).toEqual(track.analysis.bpmCurve);

    vi.setSystemTime(new Date("2026-04-08T12:10:00Z"));
    const relinked = await updateMockTrackSource(track.id, {
      sourcePath: "/music/relinked/no-extension-track",
    });

    expect(relinked.file.fileExtension).toBe("audio");
    expect(relinked.file.playbackSource).toBe("source_file");
    expect(relinked.file.modifiedAt).toBe("2026-04-08T12:10:00.000Z");
  });
});
