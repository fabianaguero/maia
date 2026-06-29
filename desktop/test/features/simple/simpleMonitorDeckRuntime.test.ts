import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSimpleMonitorDeckHookState,
  buildMonitorTrackAudioHookInput,
  buildSimpleMonitorDeckRuntimeState,
  buildMonitorDeckPresentationHookInput,
  buildMonitorLiveStreamHookInput,
  resolveSimpleMonitorDeckBpm,
} from "../../../src/features/simple/simpleMonitorDeckRuntime";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
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

describe("simpleMonitorDeckRuntime", () => {
  it("resolves deck bpm from live suggestion first, then track analysis", () => {
    const track = createTrack();

    expect(resolveSimpleMonitorDeckBpm(132, track)).toBe(132);
    expect(resolveSimpleMonitorDeckBpm(null, track)).toBe(126);
    expect(resolveSimpleMonitorDeckBpm(null, null)).toBeNull();
  });

  it("builds live stream hook input from deck dependencies", () => {
    const track = createTrack();
    const input = buildMonitorLiveStreamHookInput({
      isListening: true,
      sessionSourcePath: "/logs/visits-service.log",
      streamAdapterLabel: "FILE_TAIL",
      subscribe: vi.fn(() => () => undefined),
      audioContextRef: { current: null },
      backgroundAudioRef: { current: null },
      backgroundGraphRef: { current: null },
      activeTrackRef: { current: track },
      deckDurationSecondsRef: { current: 240 },
      trackWaveProgressRef: { current: 0.25 },
      deckControlsRef: { current: {} },
      trackBpm: 126,
      ensureBackgroundGraph: vi.fn(),
      applyTrackMutation: vi.fn(),
      playTestTone: vi.fn(),
      playCueBatch: vi.fn(),
      liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
    });

    expect(input.trackBpm).toBe(126);
    expect(input.idleHoldMs).toBe(DEFAULT_MONITOR_SETUP_PREFERENCES.idleHoldMs);
    expect(input.maxLiveLines).toBe(DEFAULT_MONITOR_SETUP_PREFERENCES.tailWindowRows);
    expect(input.streamAdapterLabel).toBe("FILE_TAIL");
  });

  it("builds the deck runtime state from session, controls and live bpm", () => {
    const track = createTrack();
    const deckState = buildSimpleMonitorDeckRuntimeState({
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
      tracks: [track],
      trackName: "Base Pulse",
      trackDurationSeconds: 240,
      activePreset: "balanced",
      alertShape: "balanced",
      liveSuggestedBpm: 132,
      t: en,
    });

    expect(deckState.activeTrack?.id).toBe("track-1");
    expect(deckState.deckDurationSeconds).toBe(240);
    expect(deckState.streamAdapterLabel).toBe("FILE_TAIL");
    expect(deckState.isMonitorActive).toBe(true);
    expect(deckState.deckPresetLabel).toBe("Balanced");
    expect(deckState.deckVisualPreset).toBe("balanced");
    expect(deckState.deckBpm).toBe(132);
  });

  it("builds track audio hook input without reshaping values", () => {
    const track = createTrack();
    const input = buildMonitorTrackAudioHookInput({
      audioContext: null,
      isListening: true,
      safeRuntime: false,
      activeTrack: track,
      ensureBackgroundGraph: vi.fn(),
      setTrackWaveProgress: vi.fn(),
      setTrackElapsedSeconds: vi.fn(),
      setTrackDurationSeconds: vi.fn(),
    });

    expect(input.activeTrack?.id).toBe("track-1");
    expect(input.isListening).toBe(true);
    expect(input.safeRuntime).toBe(false);
  });

  it("builds deck presentation hook input from deck state", () => {
    const presentation = buildMonitorDeckPresentationHookInput({
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

    expect(presentation.deckBpm).toBe(128);
    expect(presentation.trackWaveProgress).toBe(0.3);
    expect(presentation.selectedAnomalyId).toBe("anomaly-1");
    expect(presentation.waveformScale).toBe(1.2);
  });

  it("builds the final deck hook state without reshaping values", () => {
    const track = createTrack();
    const toggleTrackPreview = vi.fn();
    const focusAnomaly = vi.fn();
    const state = buildSimpleMonitorDeckHookState({
      activeTrack: track,
      previewTrackId: "track-1",
      toggleTrackPreview,
      deckPresetLabel: "Balanced",
      streamAdapterLabel: "FILE_TAIL",
      isMonitorActive: true,
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      selectedAnomalyId: "anomaly-1",
      simulateLog: vi.fn(),
      terminalLinesRef: { current: null },
      onTerminalScroll: vi.fn(),
      registerLineRef: vi.fn(),
      focusAnomaly,
      deckBpm: 128,
      trackElapsedSeconds: 24,
      deckDurationSeconds: 240,
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      anomalyBurstRegions: [
        {
          id: "burst-1",
          startProgress: 0.1,
          endProgress: 0.2,
          severity: 0.8,
          count: 3,
        },
      ],
      selectedBurstRegion: {
        id: "burst-1",
        startProgress: 0.1,
        endProgress: 0.2,
        severity: 0.8,
        count: 3,
      },
      overviewAnomalyMarkers: [
        {
          id: "marker-1",
          lineId: "line-1",
          timestamp: "10:00:00",
          message: "anomaly",
          severity: 0.9,
          progress: 0.2,
          leftPercent: 20,
        },
      ],
      overviewWindowLeftPercent: 0.1,
      overviewWindowWidthPercent: 0.4,
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
      waveformScale: 1.2,
    });

    expect(state.activeTrack?.id).toBe("track-1");
    expect(state.previewTrackId).toBe("track-1");
    expect(state.deckPresetLabel).toBe("Balanced");
    expect(state.streamAdapterLabel).toBe("FILE_TAIL");
    expect(state.selectedAnomalyId).toBe("anomaly-1");
    expect(state.selectedBurstRegion?.count).toBe(3);
    expect(state.waveformScale).toBe(1.2);
    expect(state.focusAnomaly).toBe(focusAnomaly);
    expect(state.toggleTrackPreview).toBe(toggleTrackPreview);
  });
});
