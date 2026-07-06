import { describe, expect, it } from "vitest";

import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../../src/types/library";
import type { LiveMutationExplanation } from "../../../../src/utils/liveMutationExplainability";
import type { PlaylistTransitionPlan } from "../../../../src/utils/playlistTransition";
import {
  buildLiveLogMonitorAdapterState,
  buildLiveLogMonitorExplanationState,
  buildLiveLogMonitorTrackSelectionState,
  resolveCueEnginePreviewLabel,
  resolveLiveMutationStateLabel,
} from "../../../../src/features/analyzer/components/liveLogMonitorViewModelRuntime";

function createTrack(input?: {
  id?: string;
  title?: string;
  path?: string;
  availabilityState?: LibraryTrack["file"]["availabilityState"];
  bpm?: number | null;
  waveformBins?: number[];
  musicStyleId?: string | null;
}): LibraryTrack {
  const path = input?.path ?? `/tmp/${input?.id ?? "track"}.wav`;

  return {
    id: input?.id ?? "track-1",
    file: {
      sourcePath: path,
      storagePath: path,
      playbackSource: "source_file",
      availabilityState: input?.availabilityState ?? "available",
      sizeBytes: null,
      checksum: null,
    },
    tags: {
      title: input?.title ?? "Demo",
      artist: "MAIA",
      album: null,
      genre: "House",
      musicStyleId: input?.musicStyleId ?? "house",
      bpm: input?.bpm ?? null,
      key: null,
      durationSec: 180,
    },
    analysis: {
      bpm: input?.bpm ?? 126,
      energy: 0.5,
      waveformBins: input?.waveformBins ?? [0.2, 0.4, 0.6],
      beatGrid: [],
      key: null,
      loudnessDb: -8,
      durationSec: 180,
    },
    performance: {
      rating: null,
      color: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
      playedCount: 0,
      lastPlayedAt: null,
    },
    title: input?.title ?? "Demo",
    sourcePath: path,
    storagePath: path,
    importedAt: new Date().toISOString(),
    bpm: input?.bpm ?? 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: input?.waveformBins ?? [0.2, 0.4, 0.6],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: input?.musicStyleId ?? "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: 0.5,
    danceability: 0.7,
    structuralPatterns: [],
  };
}

function createExplanation(input?: Partial<LiveMutationExplanation>): LiveMutationExplanation {
  return {
    id: input?.id ?? "exp-1",
    eventIndex: input?.eventIndex ?? 3,
    replayWindowIndex:
      input && "replayWindowIndex" in input ? (input.replayWindowIndex ?? null) : null,
    component: input?.component ?? "gateway",
    level: input?.level ?? "WARN",
    trackId: input && "trackId" in input ? (input.trackId ?? null) : "track-1",
    trackTitle: input && "trackTitle" in input ? (input.trackTitle ?? null) : "Demo",
    trackSecond: input && "trackSecond" in input ? (input.trackSecond ?? null) : 12,
    sourceExcerpt: input?.sourceExcerpt ?? "WARN burst",
    triggerLabel: input?.triggerLabel ?? "Warning pressure",
    triggerDetail: input?.triggerDetail ?? "WARN burst",
    resultLabel: input?.resultLabel ?? "Layer -> Stem",
    resultDetail: input?.resultDetail ?? "Bridge",
    focus: input?.focus ?? "pressure",
    waveform: input?.waveform ?? "sawtooth",
    noteHz: input?.noteHz ?? 440,
    durationMs: input?.durationMs ?? 220,
    gain: input?.gain ?? 0.5,
    routeKey: input?.routeKey ?? "warn",
    isAnomalyDriven: input?.isAnomalyDriven ?? true,
  };
}

describe("liveLogMonitorViewModelRuntime", () => {
  it("builds track selection state with playable tracks, sorted options and blended anchors", () => {
    const baseTrack = createTrack({
      id: "base-1",
      title: "Alpha",
      bpm: 124,
      waveformBins: [0.2, 0.4, 0.6],
      musicStyleId: "house",
    });
    const nowPlaying = createTrack({
      id: "live-1",
      title: "Zulu",
      bpm: 128,
      waveformBins: [0.5, 0.7, 0.9],
      musicStyleId: "house",
    });
    const hiddenNoPath = createTrack({ id: "base-2", title: "NoPath", path: "" });
    const available = createTrack({
      id: "avail-1",
      title: "Beta",
      bpm: 110,
      musicStyleId: "ambient",
    });
    const missing = createTrack({
      id: "avail-2",
      title: "Omega",
      availabilityState: "missing",
      bpm: 105,
    });
    const transitionPlan: PlaylistTransitionPlan = {
      currentTrackId: "live-1",
      nextTrackId: "avail-1",
      mode: "smooth-blend",
      crossfadeSeconds: 12,
      entrySecond: 16,
      entryLabel: "phrase",
      phraseSpanBeats: 16,
      phraseLabel: "16-beat / 4-bar",
      tempoRatio: 1,
      tempoAdjustPercent: 0,
      harmonicLabel: "A",
      bpmDelta: 2,
      energyDelta: 0.1,
      summary: "up next",
    };
    const basePlaylist: BaseTrackPlaylist = {
      id: "playlist-1",
      name: "Bed",
      trackIds: ["base-1", "base-2"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const state = buildLiveLogMonitorTrackSelectionState({
      basePlaylist,
      availableTracks: [available, missing, nowPlaying, hiddenNoPath, baseTrack],
      backgroundNowPlayingId: "live-1",
      backgroundTransitionPlan: transitionPlan,
    });

    expect(state.playableBaseTracks.map((track) => track.id)).toEqual(["base-1"]);
    expect(state.playableBaseTrackIdsKey).toBe("base-1");
    expect(state.availableBaseTrackOptions.map((track) => track.id)).toEqual([
      "avail-1",
      "live-1",
      "avail-2",
    ]);
    expect(state.backgroundNowPlayingTrack?.id).toBe("live-1");
    expect(state.backgroundTransitionNextTrack?.id).toBe("avail-1");
    expect(state.traceWaveformTrack?.id).toBe("live-1");
    expect(state.baseTrackCount).toBe(2);
    expect(state.hasBaseListeningBed).toBe(true);
    expect(state.referenceAnchor).toMatchObject({
      trackId: "playlist-blend",
      trackTitle: "Playlist blend · 2 tracks",
      musicStyleId: "house",
      bpm: 125,
      suggestedPresetId: "beat-locked",
    });
  });

  it("falls back to the first playable base track when no background track is playing", () => {
    const baseTrack = createTrack({ id: "base-1", title: "Alpha" });

    const state = buildLiveLogMonitorTrackSelectionState({
      basePlaylist: {
        id: "playlist-1",
        name: "Bed",
        trackIds: ["base-1"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      availableTracks: [baseTrack],
      backgroundNowPlayingId: null,
      backgroundTransitionPlan: null,
    });

    expect(state.traceWaveformTrack?.id).toBe("base-1");
    expect(state.backgroundTransitionNextTrack).toBeNull();
    expect(state.referenceAnchor).toMatchObject({
      trackId: "playlist-blend",
      trackTitle: "Alpha",
      suggestedPresetId: "beat-locked",
    });
  });

  it("builds explanation state with selected and replay-linked cues", () => {
    const traceTrack = createTrack({ id: "track-1", title: "Trace" });
    const selected = createExplanation({
      id: "exp-selected",
      trackId: "track-1",
      eventIndex: 5,
      replayWindowIndex: 9,
      trackSecond: 14,
      isAnomalyDriven: true,
    });
    const replayFallback = createExplanation({
      id: "exp-replay",
      trackId: "other-track",
      eventIndex: 7,
      replayWindowIndex: 6,
      trackSecond: 28,
      routeKey: "info",
      isAnomalyDriven: false,
    });
    const ignored = createExplanation({
      id: "exp-ignored",
      trackId: "track-1",
      trackSecond: null,
    });

    const selectedState = buildLiveLogMonitorExplanationState({
      recentExplanations: [selected, replayFallback, ignored],
      selectedExplanationId: "exp-selected",
      traceWaveformTrack: traceTrack,
      replayActive: true,
      playbackEventIndex: 9,
    });

    expect(selectedState.traceWaveformExplanations.map((item) => item.id)).toEqual([
      "exp-selected",
    ]);
    expect(selectedState.selectedTraceExplanation?.id).toBe("exp-selected");
    expect(selectedState.currentReplayExplanation?.id).toBe("exp-selected");
    expect(selectedState.traceWaveformCues).toEqual([
      {
        second: 14,
        label: "E5",
        type: "anomaly",
        excerpt: "gateway · Warning pressure → Layer -> Stem",
      },
    ]);

    const replayFallbackState = buildLiveLogMonitorExplanationState({
      recentExplanations: [selected, replayFallback],
      selectedExplanationId: "missing",
      traceWaveformTrack: traceTrack,
      replayActive: true,
      playbackEventIndex: 6,
    });

    expect(replayFallbackState.selectedTraceExplanation).toBeNull();
    expect(replayFallbackState.currentReplayExplanation?.id).toBe("exp-replay");
  });

  it("returns stable labels for mutation state, cue preview and adapter state", () => {
    const repository: RepositoryAnalysis = {
      id: "repo-1",
      name: "visits-service",
      sourcePath: "/logs/visits-service.log",
      sourceKind: "file",
      importedAt: new Date().toISOString(),
      analyzerStatus: "ready",
      suggestedBpm: 126,
      suggestedBpmConfidence: 0.8,
      notes: [],
      componentMetrics: [],
      fileCount: 1,
      totalLineCount: 100,
      dominantLanguage: "plaintext",
    };

    expect(resolveLiveMutationStateLabel("critical")).toBe("Critical tension");
    expect(resolveLiveMutationStateLabel("warning")).toBe("Warning pressure");
    expect(resolveLiveMutationStateLabel("stable")).toBe("Normal drift");

    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: true,
        sampleStatus: "ready",
        liveMutationStateLabel: "Critical tension",
        sampleSourceCount: 2,
      }),
    ).toBe("Guide-track modulation + samples · Critical tension");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: true,
        sampleStatus: "error",
        liveMutationStateLabel: "Warning pressure",
        sampleSourceCount: 0,
      }),
    ).toBe("Guide-track modulation · Warning pressure");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: false,
        sampleStatus: "ready",
        liveMutationStateLabel: "Normal drift",
        sampleSourceCount: 2,
      }),
    ).toBe("Base sample pack · Normal drift");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: false,
        sampleStatus: "ready",
        liveMutationStateLabel: "Normal drift",
        sampleSourceCount: 1,
      }),
    ).toBe("Base sample · Normal drift");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: false,
        sampleStatus: "loading",
        liveMutationStateLabel: "Normal drift",
        sampleSourceCount: 0,
      }),
    ).toBe("Loading sample · Normal drift");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: false,
        sampleStatus: "unavailable",
        liveMutationStateLabel: "Normal drift",
        sampleSourceCount: 0,
      }),
    ).toBe("Internal synth · Normal drift");

    const adapterState = buildLiveLogMonitorAdapterState({
      repository,
      repositoryId: "repo-1",
      adapterKind: "file",
      sessionRepoId: "repo-1",
      sessionAdapterKind: "journald",
    });
    const inactiveAdapterState = buildLiveLogMonitorAdapterState({
      repository,
      repositoryId: "repo-1",
      adapterKind: "file",
      sessionRepoId: "repo-2",
      sessionAdapterKind: "journald",
    });

    expect(adapterState).toEqual({
      activeAdapterKind: "journald",
      activeAdapterLabel: "journald",
      adapterDescription:
        "Tail the imported log file directly from disk through Maia's single supported live-analysis pipeline.",
      adapterTarget: "/logs/visits-service.log",
    });
    expect(inactiveAdapterState.activeAdapterKind).toBe("file");
    expect(inactiveAdapterState.activeAdapterLabel).toBe("File tail");
  });
});
