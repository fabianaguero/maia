import { describe, expect, it } from "vitest";

import {
  resolveBackgroundDeckLifecyclePlan,
  resolveBackgroundDeckStartPlan,
  resolveBackgroundTransitionSchedulePlan,
} from "../../src/features/analyzer/components/liveLogMonitorBackgroundRuntime";

const track = (id: string, durationSeconds = 180) =>
  ({
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-26T00:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds,
    waveformBins: [],
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
      sizeBytes: 1000,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-26T00:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.9,
      durationSeconds,
      waveformBins: [],
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
  }) as const;

describe("liveLogMonitorBackgroundRuntime", () => {
  it("resolves lifecycle actions for suspend, restart and sync states", () => {
    expect(
      resolveBackgroundDeckLifecyclePlan({
        liveEnabled: false,
        playableBaseTracks: [track("a")],
        currentDeck: null,
      }),
    ).toEqual({ action: "suspend" });

    expect(
      resolveBackgroundDeckLifecyclePlan({
        liveEnabled: true,
        playableBaseTracks: [track("a")],
        currentDeck: null,
      }),
    ).toEqual({ action: "restart", trackIndex: 0, fadeOutSeconds: 0.1 });

    expect(
      resolveBackgroundDeckLifecyclePlan({
        liveEnabled: true,
        playableBaseTracks: [track("a"), track("b")],
        currentDeck: {
          trackId: "b",
          trackIndex: 0,
          looping: false,
          entrySecond: 12,
          playbackRate: 1,
          durationSec: 120,
        },
      }),
    ).toEqual({ action: "sync", trackId: "b", trackIndex: 1 });
  });

  it("builds a transition schedule only when another track is available", () => {
    expect(
      resolveBackgroundTransitionSchedulePlan({
        playableBaseTracks: [track("a")],
        currentDeck: {
          trackIndex: 0,
          entrySecond: 4,
          playbackRate: 1,
          durationSec: 100,
        },
        styleProfile: {
          playlistCrossfadeSeconds: 4,
          transitionFeel: "steady",
        },
        mutationProfile: {
          transitionTightness: 0.5,
        },
      }),
    ).toEqual({ action: "clear" });

    const planned = resolveBackgroundTransitionSchedulePlan({
      playableBaseTracks: [track("a"), track("b")],
      currentDeck: {
        trackIndex: 0,
        entrySecond: 4,
        playbackRate: 1,
        durationSec: 100,
      },
      styleProfile: {
        playlistCrossfadeSeconds: 4,
        transitionFeel: "steady",
      },
      mutationProfile: {
        transitionTightness: 0.5,
      },
    });

    expect(planned.action).toBe("schedule");
    expect(planned.trackIndex).toBe(1);
    expect(planned.transitionPlan?.nextTrackId).toBe("b");
    expect(typeof planned.delayMs).toBe("number");
  });

  it("builds a deck start plan for single-track and transition playlists", () => {
    const single = resolveBackgroundDeckStartPlan({
      track: track("a"),
      hasPlaylistTransitions: false,
      styleProfile: {
        playlistCrossfadeSeconds: 4,
        transitionFeel: "steady",
      },
      fallbackFadeInSeconds: 0.9,
      bufferDuration: 120,
    });
    expect(single.looping).toBe(true);
    expect(single.entrySecond).toBe(0);
    expect(single.fadeSeconds).toBe(0.9);

    const multi = resolveBackgroundDeckStartPlan({
      track: track("a"),
      hasPlaylistTransitions: true,
      styleProfile: {
        playlistCrossfadeSeconds: 4,
        transitionFeel: "steady",
      },
      fallbackFadeInSeconds: 0.9,
      bufferDuration: 120,
    });
    expect(multi.looping).toBe(false);
    expect(multi.fadeSeconds).toBeGreaterThanOrEqual(0.4);
  });
});
