import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  importMockTrack,
  listMockTracks,
  seedMockTracks,
  updateMockTrackPerformance,
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

    expect(tracks.map((track) => track.title)).toEqual([
      "Newer Track",
      "Older Track",
    ]);
  });

  it("seeds the browser fallback library only once", async () => {
    const firstSeed = await seedMockTracks();
    const secondSeed = await seedMockTracks();

    expect(firstSeed).toHaveLength(3);
    expect(secondSeed.map((track) => track.id)).toEqual(
      firstSeed.map((track) => track.id),
    );
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
});
