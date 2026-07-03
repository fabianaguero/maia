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

  it("builds a phrase-bridge plan when tempo/energy are moderate but not smooth-blend compatible", () => {
    const currentTrack = createTrack("current", {
      bpm: 124,
      keySignature: "C major",
      energyLevel: 0.42,
    });
    const nextTrack = createTrack("next", {
      bpm: 129,
      keySignature: "G major",
      energyLevel: 0.53,
      hotCueSecond: 11,
    });

    const plan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
      styleProfile: {
        playlistCrossfadeSeconds: 6.5,
        transitionFeel: "steady",
      },
      mutationProfile: {
        transitionTightness: 1,
      },
    });

    expect(plan.mode).toBe("phrase-bridge");
    expect(plan.harmonicLabel).toContain("Adjacent");
    expect(plan.summary).toContain("Phrase bridge");
  });

  it("resolves same-key and open-key mixes and falls back to memory cue or intro markers", () => {
    const sameKeyCurrent = createTrack("same-current", {
      keySignature: "C major",
      bpm: 124,
    });
    const sameKeyNext = createTrack("same-next", {
      keySignature: "C major",
      bpm: 124,
      mainCueSecond: null,
      hotCueSecond: undefined,
    });
    sameKeyNext.performance.memoryCues = [
      {
        id: "memory-1",
        slot: 1,
        second: 13.25,
        label: "Memory jump",
        kind: "memory",
        color: null,
      },
    ];

    const sameKeyPlan = resolvePlaylistTransitionPlan(sameKeyCurrent, sameKeyNext);
    expect(sameKeyPlan.harmonicLabel).toContain("Same key");
    expect(sameKeyPlan.entryLabel).toContain("Memory jump");

    const openKeyTrack = createTrack("open-key", {
      keySignature: "???",
      bpm: 110,
      mainCueSecond: null,
      hotCueSecond: undefined,
    });
    openKeyTrack.performance.memoryCues = [];
    openKeyTrack.analysis.structuralPatterns = [
      {
        type: "opening",
        start: 14,
        end: 32,
        confidence: 0.8,
        label: "Opening theme",
      },
    ];

    const openKeyPlan = resolvePlaylistTransitionPlan(sameKeyCurrent, openKeyTrack);
    expect(openKeyPlan.harmonicLabel).toBe("Open key");
    expect(openKeyPlan.entryLabel).toContain("Opening theme");
  });

  it("falls back to track head and natural delay when no beat grid alignment is available", () => {
    const noGridTrack = createTrack("no-grid", {
      durationSeconds: 64,
      mainCueSecond: null,
      hotCueSecond: undefined,
    });
    noGridTrack.performance.memoryCues = [];
    noGridTrack.analysis.structuralPatterns = [];
    noGridTrack.analysis.beatGrid = [];

    const startPlan = resolvePlaylistStartPlan(noGridTrack, {
      styleProfile: {
        playlistCrossfadeSeconds: 20,
        transitionFeel: "tight",
      },
    });

    expect(startPlan.entrySecond).toBe(0);
    expect(startPlan.entryLabel).toBe("Track start");
    expect(startPlan.summary).toBe("Cue start at track head");
    expect(startPlan.crossfadeSeconds).toBe(8);

    const noStartBeatTrack = createTrack("no-start-beat", {
      durationSeconds: 90,
      mainCueSecond: 8,
    });
    noStartBeatTrack.analysis.beatGrid = [
      { index: 0, second: 0 },
      { index: 1, second: 4 },
    ];

    const delayMs = resolvePhraseAlignedTransitionDelayMs({
      track: noStartBeatTrack,
      entrySecond: 12,
      playbackRate: 1.5,
      crossfadeSeconds: 5,
      phraseSpanBeats: 16,
      fallbackDurationSeconds: 90,
    });

    expect(delayMs).toBe(Math.round(Math.max(0.25, (90 - 12) / 1.5 - 5) * 1000));
  });

  it("uses fallback cue labels, treats invalid pitch classes as open key, and keeps neutral tempo when nearly matched", () => {
    const currentTrack = createTrack("current-neutral", {
      bpm: 128,
      keySignature: "C major",
      energyLevel: 0.5,
    });
    const nextTrack = createTrack("next-neutral", {
      bpm: 127.8,
      keySignature: "H major",
      mainCueSecond: null,
      hotCueSecond: undefined,
    });

    nextTrack.performance.hotCues = [
      {
        id: "hot-blank",
        slot: 1,
        second: 9.2,
        label: "",
        kind: "hot",
        color: null,
      },
    ];
    nextTrack.analysis.structuralPatterns = [];

    const plan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
      styleProfile: {
        playlistCrossfadeSeconds: 6,
        transitionFeel: "tight",
      },
      mutationProfile: {
        transitionTightness: 1,
      },
    });

    expect(plan.harmonicLabel).toBe("Open key");
    expect(plan.entryLabel).toContain("Hot cue");
    expect(plan.tempoRatio).toBe(1);
    expect(plan.tempoAdjustPercent).toBe(0);
    expect(plan.summary).toContain("tempo neutral");
  });

  it("falls back to default memory and intro labels when their labels are empty", () => {
    const currentTrack = createTrack("memory-current", {
      bpm: 124,
      keySignature: "C major",
    });

    const memoryTrack = createTrack("memory-next", {
      bpm: 124,
      keySignature: "C major",
      mainCueSecond: null,
      hotCueSecond: undefined,
    });
    memoryTrack.performance.memoryCues = [
      {
        id: "memory-blank",
        slot: 1,
        second: 18,
        label: "",
        kind: "memory",
        color: null,
      },
    ];

    const memoryPlan = resolvePlaylistTransitionPlan(currentTrack, memoryTrack);
    expect(memoryPlan.entryLabel).toContain("Memory cue");

    const introTrack = createTrack("intro-next", {
      bpm: 118,
      keySignature: "???",
      mainCueSecond: null,
      hotCueSecond: undefined,
    });
    introTrack.performance.memoryCues = [];
    introTrack.analysis.structuralPatterns = [
      {
        type: "opening",
        start: 10,
        end: 24,
        confidence: 0.8,
        label: "",
      },
    ];

    const introPlan = resolvePlaylistTransitionPlan(currentTrack, introTrack);
    expect(introPlan.entryLabel).toContain("Intro");
  });

  it("falls back to natural delay when no phrase offset fits and otherwise uses the first later phrase offset", () => {
    const sparsePhraseTrack = createTrack("sparse-phrase", {
      durationSeconds: 12,
      mainCueSecond: 8,
    });
    sparsePhraseTrack.analysis.beatGrid = [
      { index: 0, second: 0 },
      { index: 1, second: 8 },
      { index: 2, second: 11.5 },
    ];

    const naturalDelayMs = resolvePhraseAlignedTransitionDelayMs({
      track: sparsePhraseTrack,
      entrySecond: 8,
      playbackRate: 1,
      crossfadeSeconds: 3.5,
      phraseSpanBeats: 16,
      fallbackDurationSeconds: 12,
    });

    expect(naturalDelayMs).toBe(500);

    const laterPhraseTrack = createTrack("later-phrase", {
      durationSeconds: null,
      mainCueSecond: 8,
    });
    laterPhraseTrack.analysis.durationSeconds = null;
    laterPhraseTrack.analysis.beatGrid = [
      { index: 20, second: 8 },
      { index: 21, second: 8.4 },
      { index: 22, second: 8.8 },
      { index: 23, second: 9.2 },
    ];

    const alignedDelayMs = resolvePhraseAlignedTransitionDelayMs({
      track: laterPhraseTrack,
      entrySecond: 8,
      playbackRate: 1,
      crossfadeSeconds: 3,
      phraseSpanBeats: 3,
      fallbackDurationSeconds: 12,
    });

    expect(alignedDelayMs).toBe(1200);
  });
});
