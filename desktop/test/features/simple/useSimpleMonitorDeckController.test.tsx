import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useSimpleMonitorDeckController } from "../../../src/features/simple/useSimpleMonitorDeckController";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../../../src/types/library";

const mockedModules = vi.hoisted(() => ({
  useMonitorDeckControls: vi.fn(),
  useSimpleMonitorPlaybackState: vi.fn(),
  useSimpleMonitorDeckLiveController: vi.fn(),
  useSimpleMonitorDeckPresentationState: vi.fn(),
}));

vi.mock("../../../src/features/simple/useMonitorDeckControls", () => ({
  useMonitorDeckControls: mockedModules.useMonitorDeckControls,
}));

vi.mock("../../../src/features/simple/useSimpleMonitorPlaybackState", () => ({
  useSimpleMonitorPlaybackState: mockedModules.useSimpleMonitorPlaybackState,
}));

vi.mock("../../../src/features/simple/useSimpleMonitorDeckLiveController", () => ({
  useSimpleMonitorDeckLiveController: mockedModules.useSimpleMonitorDeckLiveController,
}));

vi.mock("../../../src/features/simple/useSimpleMonitorDeckPresentationState", () => ({
  useSimpleMonitorDeckPresentationState: mockedModules.useSimpleMonitorDeckPresentationState,
}));

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

describe("useSimpleMonitorDeckController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedModules.useMonitorDeckControls.mockReturnValue({
      deckControls: {
        alertShape: "balanced",
        waveformScale: 1.4,
      },
      activePreset: "balanced",
    });
    mockedModules.useSimpleMonitorPlaybackState.mockReturnValue({
      trackWaveProgress: 0.25,
      setTrackWaveProgress: vi.fn(),
      trackElapsedSeconds: 32,
      setTrackElapsedSeconds: vi.fn(),
      trackDurationSeconds: 240,
      setTrackDurationSeconds: vi.fn(),
      trackWaveProgressRef: { current: 0.25 },
    });
    mockedModules.useSimpleMonitorDeckLiveController.mockReturnValue({
      previewTrackId: "track-1",
      toggleTrackPreview: vi.fn(),
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      logSignalBuffer: [{ val: 24, heat: 0.2 }],
      liveSuggestedBpm: 132,
      waveformAnomalies: [],
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: vi.fn(),
      simulateLog: vi.fn(),
    });
    mockedModules.useSimpleMonitorDeckPresentationState.mockReturnValue({
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
    });
  });

  it("composes monitor deck sub-hooks into the final deck state", () => {
    const track = createTrack();
    const session: ActiveMonitorSession = {
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
    };

    const { result } = renderHook(() =>
      useSimpleMonitorDeckController({
        skin: "copper",
        session,
        isListening: true,
        isLaunchingMonitor: false,
        safeTracks: [track],
        trackName: "Base Pulse",
        audioContext: null,
        subscribe: vi.fn(() => () => undefined),
        waveformBins: [0.2, 0.4],
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        t: en,
      }),
    );

    expect(result.current.activeTrack?.id).toBe("track-1");
    expect(result.current.previewTrackId).toBe("track-1");
    expect(result.current.deckBpm).toBe(132);
    expect(result.current.streamAdapterLabel).toBe("FILE_TAIL");
    expect(result.current.waveformScale).toBe(1.4);
    expect(result.current.liveLines[0]?.id).toBe("line-1");
    expect(mockedModules.useSimpleMonitorDeckLiveController).toHaveBeenCalledTimes(1);
    expect(mockedModules.useMonitorDeckControls).toHaveBeenCalledWith({ skin: "copper" });
  });
});
