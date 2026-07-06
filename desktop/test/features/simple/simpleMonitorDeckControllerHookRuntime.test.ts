import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorDeckControllerHookResultArgs,
  buildSimpleMonitorDeckControllerLiveHookArgs,
  buildSimpleMonitorDeckControllerModelInput,
  buildSimpleMonitorDeckControllerPresentationHookArgs,
  buildSimpleMonitorDeckControllerRuntimeInput,
} from "../../../src/features/simple/simpleMonitorDeckControllerHookRuntime";
import { en } from "../../../src/i18n/en";
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

describe("simpleMonitorDeckControllerHookRuntime", () => {
  it("passes the hook runtime input through unchanged", () => {
    const input = {
      skin: "copper",
      session: null,
      isListening: true,
      isLaunchingMonitor: false,
      safeTracks: [createTrack()],
      trackName: "Base Pulse",
      audioContext: null,
      subscribe: vi.fn(() => () => undefined),
      waveformBins: [0.2, 0.4],
      isConsoleExpanded: false,
      onToggleConsole: vi.fn(),
      liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    } as const;

    expect(buildSimpleMonitorDeckControllerRuntimeInput(input)).toBe(input);
  });

  it("builds model, live and presentation hook args from controller slices", () => {
    const state = buildSimpleMonitorDeckControllerRuntimeInput({
      skin: "copper",
      session: null,
      isListening: true,
      isLaunchingMonitor: false,
      safeTracks: [createTrack()],
      trackName: "Base Pulse",
      audioContext: null,
      subscribe: vi.fn(() => () => undefined),
      waveformBins: [0.2, 0.4],
      isConsoleExpanded: false,
      onToggleConsole: vi.fn(),
      liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });
    const deckControls = {
      waveformScale: 1.4,
      beatSnapSubdivision: 0.25,
      reactivity: 55,
      anomalyEmphasis: 70,
      idleMotion: 30,
      cueCooldownMs: 850,
      masterVolume: 0.75,
      duckingIntensity: 35,
      recoveryRelease: 45,
      alertShape: "balanced" as const,
    };
    const controllerModel = {
      activeTrack: createTrack(),
      deckDurationSeconds: 240,
      streamAdapterLabel: "FILE_TAIL",
      activeBeatGrid: [],
      deckVisualPreset: "balanced",
      deckPresetLabel: "Balanced",
      isMonitorActive: true,
    };
    const playback = {
      trackWaveProgress: 0.25,
      setTrackWaveProgress: vi.fn(),
      trackElapsedSeconds: 42,
      setTrackElapsedSeconds: vi.fn(),
      trackDurationSeconds: 240,
      setTrackDurationSeconds: vi.fn(),
      trackWaveProgressRef: { current: 0.25 },
    };
    const liveState = {
      backgroundAudioRef: { current: null },
      waveformAnomalies: [],
      logSignalBuffer: [{ val: 24, heat: 0.2 }],
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: vi.fn(),
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      previewTrackId: "track-1",
      toggleTrackPreview: vi.fn(),
      simulateLog: vi.fn(),
    };

    expect(
      buildSimpleMonitorDeckControllerModelInput({
        state,
        deckControls,
        activePreset: "balanced",
        trackDurationSeconds: 240,
      }),
    ).toEqual({
      state,
      deckControls,
      activePreset: "balanced",
      trackDurationSeconds: 240,
    });

    expect(
      buildSimpleMonitorDeckControllerLiveHookArgs({
        state,
        deckControls,
        controllerModel,
        playback,
      }),
    ).toEqual(
      expect.objectContaining({
        state,
        deckControls,
        activeTrack: controllerModel.activeTrack,
        streamAdapterLabel: "FILE_TAIL",
        trackWaveProgressRef: playback.trackWaveProgressRef,
      }),
    );

    expect(
      buildSimpleMonitorDeckControllerPresentationHookArgs({
        state,
        deckControls,
        controllerModel,
        playback,
        liveState,
        deckBpm: 132,
        safeRuntime: false,
      }),
    ).toEqual(
      expect.objectContaining({
        backgroundAudioRef: liveState.backgroundAudioRef,
        waveformBins: state.waveformBins,
        selectedAnomalyId: liveState.selectedAnomalyId,
        waveformScale: deckControls.waveformScale,
        deckBpm: 132,
      }),
    );
  });

  it("builds final hook-state args from controller, playback, live and presentation slices", () => {
    const track = createTrack();
    const result = buildSimpleMonitorDeckControllerHookResultArgs({
      controllerModel: {
        activeTrack: track,
        deckPresetLabel: "Balanced",
        streamAdapterLabel: "FILE_TAIL",
        isMonitorActive: true,
        deckDurationSeconds: 240,
      },
      playback: {
        trackElapsedSeconds: 42,
      },
      liveState: {
        previewTrackId: "track-1",
        toggleTrackPreview: vi.fn(),
        liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
        selectedAnomalyId: "anomaly-1",
        simulateLog: vi.fn(),
      },
      presentationState: {
        terminalLinesRef: { current: null },
        onTerminalScroll: vi.fn(),
        registerLineRef: vi.fn(),
        focusAnomaly: vi.fn(),
        overviewCanvasRef: { current: null },
        waveformCanvasRef: { current: null },
        waveformStageRef: { current: null },
        handleOverviewPointerDown: vi.fn(),
        handleOverviewClick: vi.fn(),
        handleOverviewAnomalyClick: vi.fn(),
        handleOverviewAnomalyPointerDown: vi.fn(),
        handleStagePointerDown: vi.fn(),
        handleStageClick: vi.fn(),
        anomalyBurstRegions: [],
        overviewWindowWidthPercent: 0.4,
        overviewWindowLeftPercent: 0.1,
        overviewPlayheadLeftPercent: 0.2,
        overviewAnomalyMarkers: [],
        selectedDeckMarker: null,
        selectedBurstRegion: null,
        deckTimelineMarkers: [],
        deckBeatMarkers: [],
      },
      deckBpm: 132,
      waveformScale: 1.4,
    });

    expect(result).toEqual(
      expect.objectContaining({
        activeTrack: track,
        previewTrackId: "track-1",
        streamAdapterLabel: "FILE_TAIL",
        trackElapsedSeconds: 42,
        deckBpm: 132,
        waveformScale: 1.4,
      }),
    );
  });
});
