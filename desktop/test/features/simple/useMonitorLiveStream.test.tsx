import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { useMonitorLiveStream } from "../../../src/features/simple/useMonitorLiveStream";

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.82,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: { info: 1, warn: 1 },
    anomalyMarkers: [
      {
        eventIndex: 1,
        level: "warn",
        component: "visits-service",
        excerpt: "Timeout while reading upstream response",
      },
    ],
    topComponents: [{ component: "visits-service", count: 2 }],
    sonificationCues: [
      {
        id: "cue-1",
        eventIndex: 1,
        level: "warn",
        component: "visits-service",
        excerpt: "Timeout while reading upstream response",
        noteHz: 220,
        durationMs: 140,
        gain: 0.16,
        waveform: "triangle",
        accent: "anomaly",
      },
    ],
    parsedLines: [
      "INFO 2026-06-24T21:11:36.467853Z app boot complete",
      "WARN 2026-06-24T21:11:38.209845Z Timeout while reading upstream response",
    ],
    warnings: [],
    ...overrides,
  };
}

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.5],
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
      sourcePath: "/music/base.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1234,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Base Pulse",
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
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.5],
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

describe("useMonitorLiveStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes the live tail and consumes subscribed updates", () => {
    let listener: ((update: LiveLogStreamUpdate) => void) | null = null;
    const playTestTone = vi.fn();
    const playCueBatch = vi.fn();
    const applyTrackMutation = vi.fn();
    const ensureBackgroundGraph = vi.fn();
    const backgroundAudioRef = {
      current: {
        duration: 240,
        currentTime: 60,
      } as HTMLAudioElement,
    };

    const { result } = renderHook(() =>
      useMonitorLiveStream({
        isListening: true,
        sessionSourcePath: "/logs/visits-service.log",
        streamAdapterLabel: "PROCESS_TAIL",
        subscribe: (nextListener) => {
          listener = nextListener;
          return () => {
            listener = null;
          };
        },
        audioContextRef: {
          current: {
            state: "running",
          } as AudioContext,
        },
        backgroundAudioRef,
        backgroundGraphRef: { current: {} },
        activeTrackRef: { current: createTrack() },
        deckDurationSecondsRef: { current: 240 },
        trackWaveProgressRef: { current: 0.25 },
        deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
        trackBpm: 126,
        ensureBackgroundGraph,
        applyTrackMutation,
        playTestTone,
        playCueBatch,
        idleHoldMs: 900,
        maxLiveLines: 8,
      }),
    );

    expect(result.current.liveLines).toHaveLength(1);
    expect(result.current.liveLines[0]?.message).toContain("MAIA_MONITOR_INITIALIZED");

    act(() => {
      listener?.(createUpdate());
    });

    expect(playTestTone).toHaveBeenCalledTimes(1);
    expect(ensureBackgroundGraph).toHaveBeenCalledTimes(1);
    expect(applyTrackMutation).toHaveBeenCalledTimes(1);
    expect(playCueBatch).toHaveBeenCalledTimes(1);
    expect(result.current.liveSuggestedBpm).toBe(126);
    expect(result.current.liveLines).toHaveLength(3);
    expect(result.current.waveformAnomalies.length).toBeGreaterThan(0);
    expect(result.current.selectedAnomalyId).not.toBeNull();
    expect(result.current.logSignalBuffer[60]?.val).toBeGreaterThan(20);
  });

  it("adds idle motion and allows simulated log bursts", () => {
    const dateNowSpy = vi.spyOn(Date, "now");
    dateNowSpy.mockReturnValue(1_000);

    const { result } = renderHook(() =>
      useMonitorLiveStream({
        isListening: true,
        sessionSourcePath: "/logs/visits-service.log",
        streamAdapterLabel: "FILE_TAIL",
        subscribe: () => () => undefined,
        audioContextRef: { current: null },
        backgroundAudioRef: { current: null },
        backgroundGraphRef: { current: null },
        activeTrackRef: { current: createTrack() },
        deckDurationSecondsRef: { current: 240 },
        trackWaveProgressRef: { current: 0.1 },
        deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
        trackBpm: 126,
        ensureBackgroundGraph: vi.fn(),
        applyTrackMutation: vi.fn(),
        playTestTone: vi.fn(),
        playCueBatch: vi.fn(),
        idleHoldMs: 300,
        maxLiveLines: 8,
      }),
    );

    const baselineValue = result.current.logSignalBuffer[60]?.val ?? 0;

    dateNowSpy.mockReturnValue(2_000);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.logSignalBuffer[60]?.val).not.toBe(baselineValue);

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.6);
    act(() => {
      result.current.simulateLog();
    });

    expect(result.current.liveLines[0]?.id).toContain("sim-");
    expect(result.current.liveLines[0]?.isAnomaly).toBe(true);
    expect(result.current.logSignalBuffer[60]?.heat).toBeGreaterThan(0);

    randomSpy.mockRestore();
    dateNowSpy.mockRestore();
  });
});
