import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useSimpleMonitorScreenController } from "../../../src/features/simple/useSimpleMonitorScreenController";
import type { PersistedSession } from "../../../src/api/sessions";
import type { MonitorMetrics } from "../../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack, RepositoryAnalysis } from "../../../src/types/library";

const mockedLaunchState = vi.fn();
const mockedDeckRuntime = vi.fn();
const mockedAnomalyFilterState = vi.fn();

vi.mock("../../../src/features/simple/useSimpleMonitorLaunchState", () => ({
  useSimpleMonitorLaunchState: (input: unknown) => mockedLaunchState(input),
}));

vi.mock("../../../src/features/simple/useSimpleMonitorDeckRuntime", () => ({
  useSimpleMonitorDeckRuntime: (input: unknown) => mockedDeckRuntime(input),
}));

vi.mock("../../../src/features/simple/useSimpleMonitorAnomalyFilterState", () => ({
  useSimpleMonitorAnomalyFilterState: (input: unknown) => mockedAnomalyFilterState(input),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={en}>{children}</I18nContext.Provider>;
}

const repositories: RepositoryAnalysis[] = [
  {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-26T10:00:00.000Z",
    suggestedBpm: null,
    confidence: 0.7,
    summary: "",
    analyzerStatus: "ready",
    buildSystem: "",
    primaryLanguage: "log",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  },
];

const tracks: LibraryTrack[] = [
  {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-26T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.9,
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
      sizeBytes: 1200,
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
      bpmConfidence: 0.9,
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
  },
];

const sessions: PersistedSession[] = [
  {
    id: "session-1",
    sourcePath: "/logs/visits-service.log",
    sourceTitle: "visits-service",
    label: "Night watch",
    trackTitle: "Base Pulse",
    status: "completed",
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T10:05:00.000Z",
    totalLines: 24,
    totalAnomalies: 2,
  },
];

const metrics: MonitorMetrics = {
  windowCount: 3,
  processedLines: 24,
  totalAnomalies: 2,
};

describe("useSimpleMonitorScreenController", () => {
  it("composes launch, deck, anomaly, and collection state into hook args", () => {
    const onStop = vi.fn();
    const onResumeAudio = vi.fn();
    const onStartMonitoring = vi.fn();
    const onReplaySession = vi.fn();
    const onToggleConsole = vi.fn();

    mockedLaunchState.mockReturnValue({
      selectedSoundId: "track-1",
      setSelectedSoundId: vi.fn(),
      filteredMonitorSourceOptions: [],
      selectedSourceOption: null,
      canStartSelectedSource: true,
      sourceEmptyMessage: "No sources",
      startHint: "Ready",
      selectedSourceId: "repo-1",
      setSelectedSourceId: vi.fn(),
      sourceFilter: "all",
      setSourceFilter: vi.fn(),
      isLaunchingMonitor: false,
      handleStartMonitoringRequest: vi.fn(),
    });
    mockedDeckRuntime.mockReturnValue({
      activeTrack: tracks[0],
      previewTrackId: null,
      toggleTrackPreview: vi.fn(),
      deckPresetLabel: "Balanced",
      streamAdapterLabel: "FILE_TAIL",
      isMonitorActive: false,
      liveLines: [],
      selectedAnomalyId: null,
      simulateLog: vi.fn(),
      terminalLinesRef: { current: null },
      onTerminalScroll: vi.fn(),
      registerLineRef: vi.fn(),
      focusAnomaly: vi.fn(),
      deckBpm: 126,
      trackElapsedSeconds: 15,
      deckDurationSeconds: 240,
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      anomalyBurstRegions: [],
      selectedBurstRegion: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 0.1,
      overviewWindowWidthPercent: 0.3,
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
      waveformScale: 1,
    });
    mockedAnomalyFilterState.mockReturnValue({
      isAnomalyFilterActive: false,
      handleToggleAnomalyFilter: vi.fn(),
      handleClearAnomalyFilter: vi.fn(),
    });

    const { result } = renderHook(
      () =>
        useSimpleMonitorScreenController({
          session: null,
          metrics,
          pastSessions: sessions,
          repositories,
          tracks,
          onStop,
          onResumeAudio,
          audioStatus: "running",
          audioContext: null,
          onStartMonitoring,
          onReplaySession,
          subscribe: vi.fn(() => () => {}),
          isConsoleExpanded: false,
          onToggleConsole,
          liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        }),
      { wrapper },
    );

    expect(result.current.hookStateArgs.filteredMonitorSourceOptions).toEqual([]);
    expect(result.current.hookStateArgs.startHint).toBe("Ready");
    expect(result.current.hookStateArgs.sessions[0]?.id).toBe("session-1");
    expect(result.current.hookStateArgs.monitorTrackTitle).toBe("Base Pulse");
    expect(result.current.hookStateArgs.audioStatus).toBe("running");
  });
});
