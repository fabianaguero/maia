import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useSimpleMonitorScreenState } from "../../../src/features/simple/useSimpleMonitorScreenState";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../../src/features/monitor/monitorContextTypes";
import type { PersistedSession } from "../../../src/api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../../src/types/library";

const mockedState = vi.hoisted(() => ({
  launchState: {
    selectedSoundId: "track-1",
    setSelectedSoundId: vi.fn(),
    filteredMonitorSourceOptions: [],
    selectedSourceOption: null,
    canStartSelectedSource: true,
    sourceEmptyMessage: "No sources",
    startHint: "Ready",
    selectedSourceId: "repo-file",
    setSelectedSourceId: vi.fn(),
    sourceFilter: "all" as const,
    setSourceFilter: vi.fn(),
    isLaunchingMonitor: false,
    handleStartMonitoringRequest: vi.fn(),
  },
  deckRuntime: {
    activeTrack: null,
    previewTrackId: null,
    toggleTrackPreview: vi.fn(),
    deckPresetLabel: "Balanced",
    streamAdapterLabel: "FILE_TAIL",
    isMonitorActive: false,
    liveLines: [],
    selectedAnomalyId: "anomaly-1",
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
    overviewWindowWidthPercent: 0.4,
    overviewPlayheadLeftPercent: 0.25,
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
  },
}));

vi.mock("../../../src/features/simple/useSimpleMonitorLaunchState", () => ({
  useSimpleMonitorLaunchState: () => mockedState.launchState,
}));

vi.mock("../../../src/features/simple/useSimpleMonitorDeckRuntime", () => ({
  useSimpleMonitorDeckRuntime: () => mockedState.deckRuntime,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={en}>{children}</I18nContext.Provider>;
}

const repositories: RepositoryAnalysis[] = [
  {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    analyzerStatus: "ready",
    importedAt: "2026-06-26T10:00:00.000Z",
    lastAnalyzedAt: null,
    techStackSummary: [],
    fileCount: 0,
    totalLines: 0,
    entryPoints: [],
    dominantLanguages: [],
    suggestedMusicStyleId: null,
    suggestedMusicStyleLabel: null,
    suggestedBpm: null,
    suggestedBpmReason: null,
    notes: [],
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

const metrics: MonitorMetrics = {
  windowCount: 3,
  processedLines: 24,
  totalAnomalies: 2,
};

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

describe("useSimpleMonitorScreenState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedState.launchState.filteredMonitorSourceOptions = [];
    mockedState.launchState.selectedSourceOption = null;
    mockedState.launchState.selectedSourceId = "repo-file";
    mockedState.launchState.sourceFilter = "all";
    mockedState.launchState.startHint = "Ready";
    mockedState.launchState.isLaunchingMonitor = false;
    mockedState.deckRuntime.isMonitorActive = false;
    mockedState.deckRuntime.liveLines = [];
    mockedState.deckRuntime.activeTrack = null;
  });

  it("builds idle monitor props from launch and deck state", () => {
    mockedState.launchState.filteredMonitorSourceOptions = [
      {
        id: "repo-file",
        title: "visits-service",
        sourcePath: "/logs/visits-service.log",
        sourceType: "file",
        sourceTypeLabel: "Log file",
        startable: true,
        origin: "repository",
      },
    ];

    const { result } = renderHook(
      () =>
        useSimpleMonitorScreenState({
          session: null,
          metrics,
          pastSessions: sessions,
          repositories,
          tracks,
          onStop: vi.fn(),
          onResumeAudio: vi.fn(),
          audioStatus: "closed",
          audioContext: null,
          onStartMonitoring: vi.fn(),
          onReplaySession: vi.fn(),
          subscribe: vi.fn(() => () => {}),
          liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        }),
      { wrapper },
    );

    expect(result.current.isMonitorActive).toBe(false);
    expect(result.current.idleViewProps.filteredMonitorSourceOptions).toHaveLength(1);
    expect(result.current.idleViewProps.startHint).toBe("Ready");
    expect(result.current.idleViewProps.sessions[0]?.id).toBe("session-1");
  });

  it("opens the console when toggling anomaly focus from collapsed active state", () => {
    const onToggleConsole = vi.fn();
    mockedState.deckRuntime.isMonitorActive = true;
    mockedState.deckRuntime.liveLines = [
      {
        id: "line-1",
        timestamp: "10:00:00",
        level: "warn",
        message: "Timeout while reading upstream response",
        isAnomaly: true,
        anomalyId: "anomaly-1",
      },
    ];
    mockedState.deckRuntime.activeTrack = tracks[0];

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

    const { result } = renderHook(
      () =>
        useSimpleMonitorScreenState({
          session,
          metrics,
          pastSessions: sessions,
          repositories,
          tracks,
          onStop: vi.fn(),
          onResumeAudio: vi.fn(),
          audioStatus: "running",
          audioContext: null,
          onStartMonitoring: vi.fn(),
          onReplaySession: vi.fn(),
          subscribe: vi.fn(() => () => {}),
          trackName: "Base Pulse",
          waveformBins: [0.2, 0.4],
          isConsoleExpanded: false,
          onToggleConsole,
          liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
        }),
      { wrapper },
    );

    act(() => {
      result.current.activeViewProps.onToggleAnomalyFilter();
    });

    expect(result.current.isMonitorActive).toBe(true);
    expect(result.current.activeViewProps.isAnomalyFilterActive).toBe(true);
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });
});
