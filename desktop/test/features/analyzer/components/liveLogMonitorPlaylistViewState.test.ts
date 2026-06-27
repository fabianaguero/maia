import { describe, expect, it } from "vitest";

import type { BaseTrackPlaylist, LibraryTrack } from "../../../../src/types/library";
import {
  buildBasePlaylistTrackOptions,
  buildNowPlayingSummary,
  buildPlaylistEditorItems,
  buildPlaylistSummaryItems,
  buildSavedPlaylistOptions,
  buildUpNextSummary,
} from "../../../../src/features/analyzer/components/liveLogMonitorPlaylistViewState";

const importedAt = "2026-06-26T00:00:00.000Z";

function createTrack(
  overrides: Partial<LibraryTrack> & {
    id: string;
    title: string;
    bpm?: number | null;
    availabilityState?: "available" | "missing";
  },
): LibraryTrack {
  const bpm = overrides.bpm ?? 126;
  const availabilityState = overrides.availabilityState ?? "available";
  return {
    id: overrides.id,
    title: overrides.title,
    sourcePath: `/music/${overrides.id}.wav`,
    storagePath: `/managed/${overrides.id}.wav`,
    importedAt,
    bpm,
    bpmConfidence: 0.9,
    durationSeconds: 240,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    visualization: { waveform: [], beatGrid: [], hotCues: [] },
    file: {
      sourcePath: `/music/${overrides.id}.wav`,
      storagePath: `/managed/${overrides.id}.wav`,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1024,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState,
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: overrides.title,
      artist: "Maia",
      album: null,
      genre: "House",
      year: 2026,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt,
      bpm,
      bpmConfidence: 0.9,
      durationSeconds: 240,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia",
      analyzedAt: importedAt,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: "#58e6ff",
      rating: 4,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    ...overrides,
  };
}

function createPlaylist(): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Ops Nights",
    trackIds: ["track-1", "track-2"],
    createdAt: importedAt,
    updatedAt: importedAt,
  };
}

describe("liveLogMonitorPlaylistViewState", () => {
  it("builds summary and editor items with loss metadata", () => {
    const tracks = [
      createTrack({ id: "track-1", title: "Alpha", bpm: 124 }),
      createTrack({ id: "track-2", title: "Beta", bpm: 128, availabilityState: "missing" }),
    ];

    const summary = buildPlaylistSummaryItems(["track-1", "track-2"], tracks);
    const editor = buildPlaylistEditorItems(["track-1", "track-2"], tracks);

    expect(summary).toHaveLength(2);
    expect(summary[1]?.lostTitle).toBeTruthy();
    expect(editor[0]).toMatchObject({ canMoveUp: false, canMoveDown: true });
    expect(editor[1]).toMatchObject({ canMoveUp: true, canMoveDown: false });
  });

  it("builds track and playlist options plus deck summaries", () => {
    const tracks = [
      createTrack({ id: "track-1", title: "Alpha", bpm: 124 }),
      createTrack({ id: "track-2", title: "Beta", bpm: 128, availabilityState: "missing" }),
    ];

    expect(buildBasePlaylistTrackOptions(tracks, "LOST")[1]).toMatchObject({
      disabled: true,
    });
    expect(buildSavedPlaylistOptions([createPlaylist()])[0]?.label).toContain("Ops Nights");
    expect(buildNowPlayingSummary(true, tracks[0] ?? null, "Now playing")).toContain("Alpha");
    expect(buildUpNextSummary(true, tracks[1] ?? null, "Blend in 8 bars", "Up next")).toContain(
      "Blend in 8 bars",
    );
    expect(buildNowPlayingSummary(false, tracks[0] ?? null, "Now playing")).toBeNull();
  });
});
