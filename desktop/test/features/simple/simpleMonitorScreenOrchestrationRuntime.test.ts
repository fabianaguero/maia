import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorDeckRuntimeInput,
  buildSimpleMonitorLaunchStateInput,
  buildSimpleMonitorScreenHookArgsInput,
} from "../../../src/features/simple/simpleMonitorScreenOrchestrationRuntime";
import { buildSimpleMonitorCollectionsState } from "../../../src/features/simple/simpleMonitorScreenStateRuntime";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack, RepositoryAnalysis } from "../../../src/types/library";
import type { PersistedSession } from "../../../src/api/sessions";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Deck Track",
    sourcePath: "/music/deck-track.wav",
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
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
      sourcePath: "/music/deck-track.wav",
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
      title: "Deck Track",
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

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-25T20:00:00.000Z",
    suggestedBpm: null,
    confidence: 0.5,
    summary: "",
    analyzerStatus: "ready",
    buildSystem: "",
    primaryLanguage: "TypeScript",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

function createSession(): PersistedSession {
  return {
    id: "session-1",
    sourcePath: "/logs/visits-service.log",
    sourceTitle: "visits-service",
    label: "Night watch",
    trackTitle: "Deck Track",
    status: "completed",
    createdAt: "2026-06-25T20:00:00.000Z",
    updatedAt: "2026-06-25T20:05:00.000Z",
    totalLines: 120,
    totalAnomalies: 4,
  };
}

describe("simpleMonitorScreenOrchestrationRuntime", () => {
  it("builds launch and deck hook inputs deterministically", () => {
    const repositories = [createRepository()];
    const safeTracks = [createTrack()];

    const launchInput = buildSimpleMonitorLaunchStateInput({
      repositories,
      isListening: false,
      t: en,
      onResumeAudio: vi.fn(),
      onStartMonitoring: vi.fn(),
    });
    const deckInput = buildSimpleMonitorDeckRuntimeInput({
      skin: "copper",
      session: null,
      isListening: false,
      isLaunchingMonitor: true,
      safeTracks,
      trackName: "Deck Track",
      audioContext: null,
      subscribe: vi.fn(() => () => {}),
      waveformBins: [0.1, 0.2],
      isConsoleExpanded: false,
      onToggleConsole: vi.fn(),
      liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });

    expect(launchInput.repositories).toHaveLength(1);
    expect(launchInput.isListening).toBe(false);
    expect(deckInput.skin).toBe("copper");
    expect(deckInput.safeTracks[0]?.id).toBe("track-1");
    expect(deckInput.isLaunchingMonitor).toBe(true);
  });

  it("builds hook-state args from launch and deck slices", () => {
    const track = createTrack();
    const session: ActiveMonitorSession = {
      id: "active-1",
      sourcePath: "/logs/visits-service.log",
      repoTitle: "visits-service",
      startedAt: Date.UTC(2026, 5, 25, 20, 0, 0),
      adapterKind: "file",
      totalLines: 12,
      totalAnomalies: 3,
      trackName: "Deck Track",
    };
    const metrics: MonitorMetrics = {
      windowCount: 2,
      processedLines: 12,
      totalAnomalies: 3,
    };

    const hookArgs = buildSimpleMonitorScreenHookArgsInput({
      session,
      metrics,
      t: en,
      nowMs: session.startedAt + 12_000,
      trackName: "Deck Track",
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      onStop: vi.fn(),
      onRefresh: vi.fn(),
      onSimulateLog: vi.fn(),
      onResumeAudio: vi.fn(),
      onReplaySession: vi.fn(),
      isAnomalyFilterActive: false,
      onToggleAnomalyFilter: vi.fn(),
      onClearAnomalyFilter: vi.fn(),
      launchState: {
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
      },
      deckRuntime: {
        activeTrack: track,
        previewTrackId: null,
        toggleTrackPreview: vi.fn(),
        deckPresetLabel: "Balanced",
        streamAdapterLabel: "FILE_TAIL",
        isMonitorActive: true,
        liveLines: [],
        selectedAnomalyId: null,
        simulateLog: vi.fn(),
        terminalLinesRef: { current: null },
        onTerminalScroll: vi.fn(),
        registerLineRef: vi.fn(),
        focusAnomaly: vi.fn(),
        deckBpm: 126,
        trackElapsedSeconds: 32,
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
      collections: buildSimpleMonitorCollectionsState({
        pastSessions: [createSession()],
        repositories: [createRepository()],
        tracks: [track],
      }),
      audioStatus: "running",
    });

    expect(hookArgs.isMonitorActive).toBe(true);
    expect(hookArgs.monitorSourceTitle).toBe("visits-service");
    expect(hookArgs.uptimeLabel).toBe("12s");
    expect(hookArgs.monitorTrackTitle).toBe("Deck Track");
  });
});
