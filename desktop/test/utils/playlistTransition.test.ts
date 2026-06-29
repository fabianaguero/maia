import { describe, expect, it } from "vitest";

import type { LibraryTrack } from "../../src/types/library";
import {
  resolvePhraseAlignedTransitionDelayMs,
  resolvePlaylistStartPlan,
  resolvePlaylistTransitionPlan,
} from "../../src/utils/playlistTransition";

function createBeatGrid(bpm: number, durationSeconds: number) {
  const beatPeriod = 60 / bpm;
  const beatCount = Math.floor(durationSeconds / beatPeriod);

  return Array.from({ length: beatCount + 1 }, (_, index) => ({
    index,
    second: Number((index * beatPeriod).toFixed(3)),
  }));
}

function createTrack(
  id: string,
  options: {
    bpm?: number | null;
    keySignature?: string | null;
    energyLevel?: number | null;
    mainCueSecond?: number | null;
    hotCueSecond?: number | null;
    bpmLock?: boolean;
    durationSeconds?: number | null;
  } = {},
): LibraryTrack {
  return {
    id,
    file: {
      sourcePath: `/tracks/${id}.wav`,
      storagePath: `/managed/${id}.wav`,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: "2026-04-08T00:00:00.000Z",
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
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
      importedAt: "2026-04-08T00:00:00.000Z",
      bpm: options.bpm ?? 128,
      bpmConfidence: 0.9,
      durationSeconds: options.durationSeconds ?? 240,
      waveformBins: [0.1, 0.2, 0.3],
      beatGrid: createBeatGrid(options.bpm ?? 128, options.durationSeconds ?? 240),
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "full",
      analyzerVersion: "test",
      analyzedAt: "2026-04-08T00:00:00.000Z",
      repoSuggestedBpm: null,
      repoSuggestedStatus: "none",
      notes: [],
      keySignature: options.keySignature ?? "C major",
      energyLevel: options.energyLevel ?? 0.62,
      danceability: 0.72,
      structuralPatterns: [
        {
          type: "intro",
          start: 12,
          end: 32,
          confidence: 0.82,
          label: "Intro",
        },
      ],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: options.bpmLock ?? false,
      gridLock: false,
      mainCueSecond: options.mainCueSecond ?? null,
      hotCues:
        typeof options.hotCueSecond === "number"
          ? [
              {
                id: `${id}-hot-1`,
                slot: 1,
                second: options.hotCueSecond,
                label: "Hot 1",
                kind: "hot",
                color: "#22d3ee",
              },
            ]
          : [],
      memoryCues: [],
      savedLoops: [],
    },
    title: id,
    sourcePath: `/tracks/${id}.wav`,
    storagePath: `/managed/${id}.wav`,
    importedAt: "2026-04-08T00:00:00.000Z",
    bpm: options.bpm ?? 128,
    bpmConfidence: 0.9,
    durationSeconds: options.durationSeconds ?? 240,
    waveformBins: [0.1, 0.2, 0.3],
    beatGrid: createBeatGrid(options.bpm ?? 128, options.durationSeconds ?? 240),
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: options.keySignature ?? "C major",
    energyLevel: options.energyLevel ?? 0.62,
    danceability: 0.72,
    structuralPatterns: [
      {
        type: "intro",
        start: 12,
        end: 32,
        confidence: 0.82,
        label: "Intro",
      },
    ],
  };
}

describe("playlist transition utils", () => {
  it("prefers main cue for a playlist start plan", () => {
    const track = createTrack("steady", { mainCueSecond: 6.4, hotCueSecond: 2.5 });

    const plan = resolvePlaylistStartPlan(track, {
      styleProfile: {
        playlistCrossfadeSeconds: 7,
        transitionFeel: "smooth",
      },
    });

    expect(plan.mode).toBe("cue-start");
    expect(plan.entrySecond).toBe(7.5);
    expect(plan.entryLabel).toContain("Main cue");
    expect(plan.phraseSpanBeats).toBe(16);
    expect(plan.summary).toContain("Cue start");
  });

  it("builds a smooth blend plan for harmonic and tempo-close tracks", () => {
    const currentTrack = createTrack("current", {
      bpm: 126,
      keySignature: "C major",
      energyLevel: 0.58,
    });
    const nextTrack = createTrack("next", {
      bpm: 128,
      keySignature: "A minor",
      energyLevel: 0.63,
      hotCueSecond: 8,
    });

    const plan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
      styleProfile: {
        playlistCrossfadeSeconds: 7.2,
        transitionFeel: "smooth",
      },
      mutationProfile: {
        transitionTightness: 0.92,
      },
    });

    expect(plan.mode).toBe("smooth-blend");
    expect(plan.harmonicLabel).toContain("Relative");
    expect(plan.entrySecond).toBe(15);
    expect(plan.phraseLabel).toBe("32-beat / 8-bar");
    expect(plan.tempoRatio).toBeCloseTo(0.98, 2);
    expect(plan.crossfadeSeconds).toBeGreaterThan(6);
  });

  it("falls back to a reset mix when bpm delta is large or bpm lock blocks correction", () => {
    const currentTrack = createTrack("current", {
      bpm: 96,
      keySignature: "C major",
      energyLevel: 0.34,
    });
    const nextTrack = createTrack("next", {
      bpm: 134,
      keySignature: "F# minor",
      energyLevel: 0.82,
      bpmLock: true,
    });

    const plan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
      styleProfile: {
        playlistCrossfadeSeconds: 5,
        transitionFeel: "tight",
      },
      mutationProfile: {
        transitionTightness: 1.2,
      },
    });

    expect(plan.mode).toBe("reset-mix");
    expect(plan.tempoRatio).toBe(1);
    expect(plan.crossfadeSeconds).toBeLessThan(3.5);
    expect(plan.summary).toContain("Reset mix");
  });

  it("aligns transition delay to the previous phrase boundary when beat grid is available", () => {
    const currentTrack = createTrack("current", {
      bpm: 120,
      durationSeconds: 120,
      mainCueSecond: 8,
    });

    const delayMs = resolvePhraseAlignedTransitionDelayMs({
      track: currentTrack,
      entrySecond: 8,
      playbackRate: 1,
      crossfadeSeconds: 6,
      phraseSpanBeats: 16,
      fallbackDurationSeconds: 112,
    });

    expect(delayMs).toBe(104000);
  });
});
