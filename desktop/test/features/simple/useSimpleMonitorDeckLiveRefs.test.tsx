import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSimpleMonitorDeckLiveRefs } from "../../../src/features/simple/useSimpleMonitorDeckLiveRefs";
import type { LibraryTrack } from "../../../src/types/library";

function createTrack(id: string): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-26T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 128,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
      artist: "Maia",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-26T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
  };
}

describe("useSimpleMonitorDeckLiveRefs", () => {
  it("keeps active track and duration refs synchronized", () => {
    const { result, rerender } = renderHook(
      ({ activeTrack, deckDurationSeconds }) =>
        useSimpleMonitorDeckLiveRefs({
          activeTrack,
          deckDurationSeconds,
        }),
      {
        initialProps: {
          activeTrack: createTrack("track-1"),
          deckDurationSeconds: 240,
        },
      },
    );

    expect(result.current.activeTrackRef.current?.id).toBe("track-1");
    expect(result.current.deckDurationSecondsRef.current).toBe(240);

    rerender({
      activeTrack: createTrack("track-2"),
      deckDurationSeconds: 128,
    });

    expect(result.current.activeTrackRef.current?.id).toBe("track-2");
    expect(result.current.deckDurationSecondsRef.current).toBe(128);
  });
});
