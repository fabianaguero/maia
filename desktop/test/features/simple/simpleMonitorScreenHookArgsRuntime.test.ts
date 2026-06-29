import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSimpleMonitorActiveHookArgs,
  buildSimpleMonitorIdleHookArgs,
  buildSimpleMonitorScreenMeta,
} from "../../../src/features/simple/simpleMonitorScreenHookArgsRuntime";
import { buildSimpleMonitorCollectionsState } from "../../../src/features/simple/simpleMonitorScreenStateRuntime";
import type { LibraryTrack, RepositoryAnalysis } from "../../../src/types/library";
import type { PersistedSession } from "../../../src/api/sessions";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../../src/features/monitor/monitorContextTypes";

function createTrack(id = "track-1"): LibraryTrack {
  return {
    id,
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

function createActiveSession(): ActiveMonitorSession {
  return {
    id: "active-1",
    sourcePath: "/logs/visits-service.log",
    repoTitle: "visits-service",
    startedAt: Date.UTC(2026, 5, 25, 20, 0, 0),
    adapterKind: "file",
    totalLines: 10,
    totalAnomalies: 2,
    trackName: "Deck Track",
  };
}

const metrics: MonitorMetrics = {
  windowCount: 2,
  processedLines: 10,
  totalAnomalies: 2,
};

describe("simpleMonitorScreenHookArgsRuntime", () => {
  it("builds shared monitor screen meta from launch and deck slices", () => {
    const track = createTrack();
    const activeSession = createActiveSession();
    const collections = buildSimpleMonitorCollectionsState({
      pastSessions: [createSession()],
      repositories: [createRepository()],
      tracks: [track],
    });

    const screenMeta = buildSimpleMonitorScreenMeta({
      session: activeSession,
      metrics,
      t: en,
      nowMs: activeSession.startedAt + 15_000,
      launchState: {
        selectedSoundId: track.id,
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
      } as never,
      deckRuntime: {
        trackElapsedSeconds: 32,
        deckDurationSeconds: 240,
      } as never,
      collections,
    });

    expect(screenMeta.monitorSourceTitle).toBe("visits-service");
    expect(screenMeta.monitorTrackTitle).toBe("Deck Track");
    expect(screenMeta.uptimeLabel).toBe("15s");
    expect(screenMeta.deckRemainingSeconds).toBe(208);
  });

  it("builds active and idle hook slices deterministically", () => {
    const track = createTrack();
    const collections = buildSimpleMonitorCollectionsState({
      pastSessions: [createSession()],
      repositories: [createRepository()],
      tracks: [track],
    });
    const deckRuntime = {
      terminalLinesRef: { current: null },
      onTerminalScroll: vi.fn(),
      liveLines: [],
      streamAdapterLabel: "FILE_TAIL",
      selectedAnomalyId: null,
      focusAnomaly: vi.fn(),
      registerLineRef: vi.fn(),
      activeTrack: track,
      deckPresetLabel: "Balanced",
      deckBpm: 126,
      trackElapsedSeconds: 32,
      selectedDeckMarker: null,
      selectedBurstRegion: null,
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      anomalyBurstRegions: [],
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 0.1,
      overviewWindowWidthPercent: 0.4,
      overviewPlayheadLeftPercent: 0.25,
      handleOverviewPointerDown: vi.fn(),
      handleOverviewClick: vi.fn(),
      handleOverviewAnomalyClick: vi.fn(),
      handleOverviewAnomalyPointerDown: vi.fn(),
      deckTimelineMarkers: [],
      deckBeatMarkers: [],
      handleStagePointerDown: vi.fn(),
      handleStageClick: vi.fn(),
      waveformScale: 1,
      previewTrackId: null,
      toggleTrackPreview: vi.fn(),
    } as never;

    const activeArgs = buildSimpleMonitorActiveHookArgs({
      screenMeta: {
        isConnectingMonitor: false,
        monitorSourceTitle: "visits-service",
        monitorSourcePath: "/logs/visits-service.log",
        monitorTrackTitle: "Deck Track",
        uptimeLabel: "15s",
        deckRemainingSeconds: 208,
      } as never,
      metrics,
      isMonitorActive: true,
      isAnomalyFilterActive: false,
      onToggleAnomalyFilter: vi.fn(),
      onClearAnomalyFilter: vi.fn(),
      onStop: vi.fn(),
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      onRefresh: vi.fn(),
      onSimulateLog: vi.fn(),
      onResumeAudio: vi.fn(),
      deckRuntime,
      audioStatus: "running",
    });

    const idleArgs = buildSimpleMonitorIdleHookArgs({
      launchState: {
        sourceFilter: "all",
        setSourceFilter: vi.fn(),
        filteredMonitorSourceOptions: [],
        selectedSourceId: "repo-1",
        setSelectedSourceId: vi.fn(),
        sourceEmptyMessage: "No sources",
        selectedSoundId: track.id,
        setSelectedSoundId: vi.fn(),
        canStartSelectedSource: true,
        startHint: "Ready",
        isLaunchingMonitor: false,
        handleStartMonitoringRequest: vi.fn(),
      } as never,
      collections,
      deckRuntime,
      onReplaySession: vi.fn(),
    });

    expect(activeArgs.monitorTrackTitle).toBe("Deck Track");
    expect(activeArgs.stageHeightPx).toBe(190);
    expect(idleArgs.getTrackTitle(track)).toBe("Deck Track");
    expect(idleArgs.sessions[0]?.id).toBe("session-1");
  });
});
