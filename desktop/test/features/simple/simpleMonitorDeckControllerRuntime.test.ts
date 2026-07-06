import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorDeckControllerBaseState,
  buildSimpleMonitorDeckControllerHookState,
  buildSimpleMonitorDeckControllerLiveInput,
  buildSimpleMonitorDeckControllerModel,
  buildSimpleMonitorDeckControllerPresentationInput,
  resolveSimpleMonitorDeckControllerBpm,
} from "../../../src/features/simple/simpleMonitorDeckControllerRuntime";
import type { LibraryTrack } from "../../../src/types/library";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-26T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.4],
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
      sizeBytes: 1024,
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
      importedAt: "2026-06-26T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4],
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

describe("simpleMonitorDeckControllerRuntime", () => {
  it("builds the base controller state without a live bpm override", () => {
    const track = createTrack();
    const state = buildSimpleMonitorDeckControllerBaseState({
      session: null,
      isListening: true,
      isLaunchingMonitor: false,
      tracks: [track],
      trackName: "Base Pulse",
      trackDurationSeconds: 240,
      activePreset: "balanced",
      alertShape: "balanced",
      t: en,
    });

    expect(state.activeTrack?.id).toBe("track-1");
    expect(state.deckDurationSeconds).toBe(240);
    expect(state.deckBpm).toBe(126);
  });

  it("resolves deck bpm from the live suggestion on top of the base active track", () => {
    expect(
      resolveSimpleMonitorDeckControllerBpm({
        liveSuggestedBpm: 132,
        activeTrack: createTrack(),
      }),
    ).toBe(132);
  });

  it("builds the controller model used by the hook composition layer", () => {
    const track = createTrack();
    const result = buildSimpleMonitorDeckControllerModel({
      state: {
        skin: "nightfall",
        session: null,
        isListening: true,
        isLaunchingMonitor: false,
        safeTracks: [track],
        trackName: "Base Pulse",
        audioContext: null,
        subscribe: vi.fn(() => () => undefined),
        waveformBins: [0.1, 0.2],
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        t: en,
      },
      deckControls: {
        waveformScale: 1.4,
        beatSnapSubdivision: 0.25,
        reactivity: 55,
        anomalyEmphasis: 70,
        idleMotion: 30,
        cueCooldownMs: 850,
        masterVolume: 0.75,
        duckingIntensity: 35,
        recoveryRelease: 45,
        alertShape: "balanced",
      },
      activePreset: "balanced",
      trackDurationSeconds: 240,
    });

    expect(result.activeTrack?.id).toBe("track-1");
    expect(result.deckDurationSeconds).toBe(240);
    expect(result.streamAdapterLabel).toBe("FILE_TAIL");
    expect(result.deckPresetLabel).toBe("Balanced");
  });

  it("builds the presentation input without reshaping controller values", () => {
    const input = buildSimpleMonitorDeckControllerPresentationInput({
      backgroundAudioRef: { current: null },
      waveformBins: [0.1, 0.2],
      waveformAnomalies: [],
      trackWaveProgress: 0.3,
      setTrackWaveProgress: vi.fn(),
      setTrackElapsedSeconds: vi.fn(),
      deckDurationSeconds: 240,
      deckBpm: 128,
      activeBeatGrid: [],
      logSignalBuffer: [{ val: 20, heat: 0 }],
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: vi.fn(),
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      deckVisualPreset: "balanced",
      waveformScale: 1.2,
      safeRuntime: false,
    });

    expect(input.deckBpm).toBe(128);
    expect(input.selectedAnomalyId).toBe("anomaly-1");
    expect(input.waveformScale).toBe(1.2);
  });

  it("builds the live controller input from runtime and playback state", () => {
    const track = createTrack();
    const input = buildSimpleMonitorDeckControllerLiveInput({
      state: {
        skin: "nightfall",
        session: {
          sessionId: "live-1",
          persistedSessionId: null,
          repoId: "repo-1",
          repoTitle: "visits-service",
          trackId: "track-1",
          trackName: "Base Pulse",
          sourcePath: "/logs/visits-service.log",
          adapterKind: "file",
          pollMode: "direct",
          startedAt: Date.now(),
        },
        isListening: true,
        isLaunchingMonitor: false,
        safeTracks: [track],
        trackName: "Base Pulse",
        audioContext: null,
        subscribe: vi.fn(() => () => undefined),
        waveformBins: [0.1, 0.2],
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        t: en,
      },
      deckControls: {
        waveformScale: 1.4,
        beatSnapSubdivision: 0.25,
        reactivity: 55,
        anomalyEmphasis: 70,
        idleMotion: 30,
        cueCooldownMs: 850,
        masterVolume: 0.75,
        duckingIntensity: 35,
        recoveryRelease: 45,
        alertShape: "tight",
      },
      activeTrack: track,
      deckDurationSeconds: 240,
      streamAdapterLabel: "FILE_TAIL",
      trackWaveProgressRef: { current: 0.25 },
      setTrackWaveProgress: vi.fn(),
      setTrackElapsedSeconds: vi.fn(),
      setTrackDurationSeconds: vi.fn(),
    });

    expect(input.streamAdapterLabel).toBe("FILE_TAIL");
    expect(input.activeTrack?.id).toBe("track-1");
    expect(input.liveSettings.tailWindowRows).toBe(
      DEFAULT_MONITOR_SETUP_PREFERENCES.tailWindowRows,
    );
  });

  it("builds the final controller hook state without losing presentation fields", () => {
    const track = createTrack();
    const result = buildSimpleMonitorDeckControllerHookState({
      activeTrack: track,
      previewTrackId: "track-1",
      toggleTrackPreview: vi.fn(),
      deckPresetLabel: "Balanced",
      streamAdapterLabel: "FILE_TAIL",
      isMonitorActive: true,
      liveLines: [
        {
          id: "line-1",
          timestamp: "00:01",
          level: "info",
          message: "ok",
          isAnomaly: false,
          anomalyId: null,
        },
      ],
      selectedAnomalyId: "anomaly-1",
      simulateLog: vi.fn(),
      terminalLinesRef: { current: null },
      onTerminalScroll: vi.fn(),
      registerLineRef: vi.fn(),
      focusAnomaly: vi.fn(),
      deckBpm: 128,
      trackElapsedSeconds: 42,
      deckDurationSeconds: 240,
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      anomalyBurstRegions: [],
      selectedBurstRegion: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 0.1,
      overviewWindowWidthPercent: 0.5,
      overviewPlayheadLeftPercent: 0.2,
      handleOverviewPointerDown: vi.fn(),
      handleOverviewClick: vi.fn(),
      handleOverviewAnomalyClick: vi.fn(),
      handleOverviewAnomalyPointerDown: vi.fn(),
      selectedDeckMarker: null,
      deckTimelineMarkers: [],
      deckBeatMarkers: [],
      handleStagePointerDown: vi.fn(),
      handleStageClick: vi.fn(),
      waveformScale: 1.3,
    });

    expect(result.previewTrackId).toBe("track-1");
    expect(result.streamAdapterLabel).toBe("FILE_TAIL");
    expect(result.waveformScale).toBe(1.3);
    expect(result.deckBpm).toBe(128);
  });
});
