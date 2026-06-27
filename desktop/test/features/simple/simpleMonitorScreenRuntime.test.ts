import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  buildSimpleMonitorActiveViewProps,
  buildSimpleMonitorScreenHookState,
  buildSimpleMonitorIdleViewProps,
  buildSimpleMonitorScreenSections,
  buildSimpleMonitorScreenStateViewModel,
  createClearAnomalyFilterHandler,
  createToggleAnomalyFilterHandler,
} from "../../../src/features/simple/simpleMonitorScreenRuntime";
import type { LibraryTrack } from "../../../src/types/library";
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

describe("simpleMonitorScreenRuntime", () => {
  it("toggles anomaly filter and opens the console when it was collapsed", () => {
    const toggleAnomalyFilter = vi.fn((updater: (value: boolean) => boolean) => updater(false));
    const onToggleConsole = vi.fn();

    createToggleAnomalyFilterHandler({
      toggleAnomalyFilter,
      isConsoleExpanded: false,
      onToggleConsole,
    })();

    expect(toggleAnomalyFilter).toHaveBeenCalledTimes(1);
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });

  it("clears anomaly filter deterministically", () => {
    const setAnomalyFilterActive = vi.fn();
    createClearAnomalyFilterHandler(setAnomalyFilterActive)();
    expect(setAnomalyFilterActive).toHaveBeenCalledWith(false);
  });

  it("builds active and idle child props from screen state", () => {
    const track = createTrack();
    const session = createSession();
    const activeProps = buildSimpleMonitorActiveViewProps({
      isConnectingMonitor: false,
      monitorSourceTitle: "visits-service",
      monitorSourcePath: "/logs/visits-service.log",
      isAnomalyFilterActive: true,
      onToggleAnomalyFilter: vi.fn(),
      onClearAnomalyFilter: vi.fn(),
      totalAnomalies: 4,
      uptimeLabel: "15s",
      onStop: vi.fn(),
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      onRefresh: vi.fn(),
      onSimulateLog: vi.fn(),
      terminalLinesRef: createRef(),
      onTerminalScroll: vi.fn(),
      liveLines: [],
      streamAdapterLabel: "FILE_TAIL",
      selectedAnomalyId: "anomaly-1",
      onSelectAnomalyLine: vi.fn(),
      registerLineRef: vi.fn(),
      monitorTrackTitle: "Deck Track",
      musicStyleLabel: "House",
      deckPresetLabel: "Balanced",
      deckBpm: 126,
      trackElapsedSeconds: 32,
      deckRemainingSeconds: 208,
      selectedDeckMarker: null,
      selectedBurstCount: 3,
      overviewCanvasRef: createRef(),
      waveformCanvasRef: createRef(),
      waveformStageRef: createRef(),
      anomalyBurstRegions: [],
      selectedBurstRegionId: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 20,
      overviewWindowWidthPercent: 30,
      overviewPlayheadLeftPercent: 35,
      onOverviewPointerDown: vi.fn(),
      onOverviewClick: vi.fn(),
      onOverviewAnomalyClick: vi.fn(),
      onOverviewAnomalyPointerDown: vi.fn(),
      deckTimelineMarkers: [],
      deckBeatMarkers: [],
      onStagePointerDown: vi.fn(),
      onStageClick: vi.fn(),
      stageHeightPx: 190,
      audioStatus: "running",
      onResumeAudio: vi.fn(),
    });

    expect(activeProps.monitorSourceTitle).toBe("visits-service");
    expect(activeProps.isAnomalyFilterActive).toBe(true);
    expect(activeProps.monitorTrackTitle).toBe("Deck Track");
    expect(activeProps.deckRemainingSeconds).toBe(208);

    const idleProps = buildSimpleMonitorIdleViewProps({
      sourceFilter: "all",
      onSourceFilterChange: vi.fn(),
      filteredMonitorSourceOptions: [
        {
          id: "repo:repo-1",
          kind: "repository",
          title: "visits-service",
          sourcePath: "/logs/visits-service.log",
        },
      ],
      selectedSourceId: "repo:repo-1",
      onSelectSourceId: vi.fn(),
      sourceEmptyMessage: "No sources",
      tracks: [track],
      selectedSoundId: track.id,
      onSelectSoundId: vi.fn(),
      getTrackTitle: (candidate) => candidate.title,
      previewTrackId: track.id,
      onToggleTrackPreview: vi.fn(),
      canStartSelectedSource: true,
      startHint: "Ready",
      isLaunchingMonitor: false,
      onStartMonitoringRequest: vi.fn(),
      sessions: [session],
      onReplaySession: vi.fn(),
    });

    expect(idleProps.filteredMonitorSourceOptions).toHaveLength(1);
    expect(idleProps.tracks[0]?.id).toBe(track.id);
    expect(idleProps.sessions[0]?.id).toBe(session.id);
    expect(idleProps.startHint).toBe("Ready");
  });

  it("builds the final screen state view-model from active and idle args", () => {
    const track = createTrack();
    const session = createSession();

    const viewModel = buildSimpleMonitorScreenStateViewModel({
      isMonitorActive: true,
      activeViewArgs: {
        isConnectingMonitor: false,
        monitorSourceTitle: "visits-service",
        monitorSourcePath: "/logs/visits-service.log",
        isAnomalyFilterActive: false,
        onToggleAnomalyFilter: vi.fn(),
        onClearAnomalyFilter: vi.fn(),
        totalAnomalies: 4,
        uptimeLabel: "15s",
        onStop: vi.fn(),
        isConsoleExpanded: true,
        onToggleConsole: vi.fn(),
        onRefresh: vi.fn(),
        onSimulateLog: vi.fn(),
        terminalLinesRef: createRef(),
        onTerminalScroll: vi.fn(),
        liveLines: [],
        streamAdapterLabel: "FILE_TAIL",
        selectedAnomalyId: null,
        onSelectAnomalyLine: vi.fn(),
        registerLineRef: vi.fn(),
        monitorTrackTitle: "Deck Track",
        musicStyleLabel: "House",
        deckPresetLabel: "Balanced",
        deckBpm: 126,
        trackElapsedSeconds: 32,
        deckRemainingSeconds: 208,
        selectedDeckMarker: null,
        selectedBurstCount: 3,
        overviewCanvasRef: createRef(),
        waveformCanvasRef: createRef(),
        waveformStageRef: createRef(),
        anomalyBurstRegions: [],
        selectedBurstRegionId: null,
        overviewAnomalyMarkers: [],
        overviewWindowLeftPercent: 20,
        overviewWindowWidthPercent: 30,
        overviewPlayheadLeftPercent: 35,
        onOverviewPointerDown: vi.fn(),
        onOverviewClick: vi.fn(),
        onOverviewAnomalyClick: vi.fn(),
        onOverviewAnomalyPointerDown: vi.fn(),
        deckTimelineMarkers: [],
        deckBeatMarkers: [],
        onStagePointerDown: vi.fn(),
        onStageClick: vi.fn(),
        stageHeightPx: 190,
        audioStatus: "running",
        onResumeAudio: vi.fn(),
      },
      idleViewArgs: {
        sourceFilter: "all",
        onSourceFilterChange: vi.fn(),
        filteredMonitorSourceOptions: [
          {
            id: "repo:repo-1",
            kind: "repository",
            title: "visits-service",
            sourcePath: "/logs/visits-service.log",
          },
        ],
        selectedSourceId: "repo:repo-1",
        onSelectSourceId: vi.fn(),
        sourceEmptyMessage: "No sources",
        tracks: [track],
        selectedSoundId: track.id,
        onSelectSoundId: vi.fn(),
        getTrackTitle: (candidate) => candidate.title,
        previewTrackId: track.id,
        onToggleTrackPreview: vi.fn(),
        canStartSelectedSource: true,
        startHint: "Ready",
        isLaunchingMonitor: false,
        onStartMonitoringRequest: vi.fn(),
        sessions: [session],
        onReplaySession: vi.fn(),
      },
    });

    expect(viewModel.isMonitorActive).toBe(true);
    expect(viewModel.activeViewProps.monitorSourceTitle).toBe("visits-service");
    expect(viewModel.idleViewProps.sessions[0]?.id).toBe(session.id);
  });

  it("builds screen sections from one derived input contract", () => {
    const track = createTrack();
    const session = createSession();

    const sections = buildSimpleMonitorScreenSections({
      isConnectingMonitor: false,
      monitorSourceTitle: "visits-service",
      monitorSourcePath: "/logs/visits-service.log",
      isAnomalyFilterActive: true,
      onToggleAnomalyFilter: vi.fn(),
      onClearAnomalyFilter: vi.fn(),
      totalAnomalies: 5,
      uptimeLabel: "20s",
      onStop: vi.fn(),
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      onRefresh: vi.fn(),
      onSimulateLog: vi.fn(),
      terminalLinesRef: createRef(),
      onTerminalScroll: vi.fn(),
      liveLines: [],
      streamAdapterLabel: "FILE_TAIL",
      selectedAnomalyId: "anomaly-1",
      onSelectAnomalyLine: vi.fn(),
      registerLineRef: vi.fn(),
      monitorTrackTitle: "Deck Track",
      musicStyleLabel: "House",
      deckPresetLabel: "Balanced",
      deckBpm: 126,
      trackElapsedSeconds: 40,
      deckRemainingSeconds: 200,
      selectedDeckMarker: null,
      selectedBurstCount: 2,
      overviewCanvasRef: createRef(),
      waveformCanvasRef: createRef(),
      waveformStageRef: createRef(),
      anomalyBurstRegions: [],
      selectedBurstRegionId: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 10,
      overviewWindowWidthPercent: 45,
      overviewPlayheadLeftPercent: 30,
      onOverviewPointerDown: vi.fn(),
      onOverviewClick: vi.fn(),
      onOverviewAnomalyClick: vi.fn(),
      onOverviewAnomalyPointerDown: vi.fn(),
      deckTimelineMarkers: [],
      deckBeatMarkers: [],
      onStagePointerDown: vi.fn(),
      onStageClick: vi.fn(),
      stageHeightPx: 190,
      audioStatus: "running",
      onResumeAudio: vi.fn(),
      sourceFilter: "all",
      onSourceFilterChange: vi.fn(),
      filteredMonitorSourceOptions: [
        {
          id: "repo-file",
          title: "visits-service",
          sourcePath: "/logs/visits-service.log",
          sourceType: "file",
          sourceTypeLabel: "Log file",
          startable: true,
          origin: "repository",
        },
      ],
      selectedSourceId: "repo-file",
      onSelectSourceId: vi.fn(),
      sourceEmptyMessage: "No sources",
      tracks: [track],
      selectedSoundId: track.id,
      onSelectSoundId: vi.fn(),
      getTrackTitle: (candidate) => candidate.title,
      previewTrackId: track.id,
      onToggleTrackPreview: vi.fn(),
      canStartSelectedSource: true,
      startHint: "Ready",
      isLaunchingMonitor: false,
      onStartMonitoringRequest: vi.fn(),
      sessions: [session],
      onReplaySession: vi.fn(),
    });

    expect(sections.activeViewArgs.monitorSourceTitle).toBe("visits-service");
    expect(sections.activeViewArgs.totalAnomalies).toBe(5);
    expect(sections.idleViewArgs.selectedSourceId).toBe("repo-file");
    expect(sections.idleViewArgs.sessions[0]?.id).toBe("session-1");
  });

  it("sorts persisted sessions when building hook state", () => {
    const track = createTrack();
    const olderSession = createSession();
    olderSession.id = "session-older";
    olderSession.updatedAt = "2026-06-25T20:01:00.000Z";
    const newerSession = createSession();
    newerSession.id = "session-newer";
    newerSession.updatedAt = "2026-06-25T20:09:00.000Z";

    const viewModel = buildSimpleMonitorScreenHookState({
      isMonitorActive: false,
      isConnectingMonitor: false,
      monitorSourceTitle: "visits-service",
      monitorSourcePath: "/logs/visits-service.log",
      isAnomalyFilterActive: false,
      onToggleAnomalyFilter: vi.fn(),
      onClearAnomalyFilter: vi.fn(),
      totalAnomalies: 5,
      uptimeLabel: "20s",
      onStop: vi.fn(),
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      onRefresh: vi.fn(),
      onSimulateLog: vi.fn(),
      terminalLinesRef: createRef(),
      onTerminalScroll: vi.fn(),
      liveLines: [],
      streamAdapterLabel: "FILE_TAIL",
      selectedAnomalyId: null,
      onSelectAnomalyLine: vi.fn(),
      registerLineRef: vi.fn(),
      monitorTrackTitle: "Deck Track",
      musicStyleLabel: "House",
      deckPresetLabel: "Balanced",
      deckBpm: 126,
      trackElapsedSeconds: 40,
      deckRemainingSeconds: 200,
      selectedDeckMarker: null,
      selectedBurstCount: null,
      overviewCanvasRef: createRef(),
      waveformCanvasRef: createRef(),
      waveformStageRef: createRef(),
      anomalyBurstRegions: [],
      selectedBurstRegionId: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 10,
      overviewWindowWidthPercent: 45,
      overviewPlayheadLeftPercent: 30,
      onOverviewPointerDown: vi.fn(),
      onOverviewClick: vi.fn(),
      onOverviewAnomalyClick: vi.fn(),
      onOverviewAnomalyPointerDown: vi.fn(),
      deckTimelineMarkers: [],
      deckBeatMarkers: [],
      onStagePointerDown: vi.fn(),
      onStageClick: vi.fn(),
      stageHeightPx: 190,
      audioStatus: "running",
      onResumeAudio: vi.fn(),
      sourceFilter: "all",
      onSourceFilterChange: vi.fn(),
      filteredMonitorSourceOptions: [],
      selectedSourceId: "repo-file",
      onSelectSourceId: vi.fn(),
      sourceEmptyMessage: "No sources",
      tracks: [track],
      selectedSoundId: track.id,
      onSelectSoundId: vi.fn(),
      getTrackTitle: (candidate) => candidate.title,
      previewTrackId: track.id,
      onToggleTrackPreview: vi.fn(),
      canStartSelectedSource: true,
      startHint: "Ready",
      isLaunchingMonitor: false,
      onStartMonitoringRequest: vi.fn(),
      sessions: [olderSession, newerSession],
      onReplaySession: vi.fn(),
    });

    expect(viewModel.isMonitorActive).toBe(false);
    expect(viewModel.idleViewProps.sessions.map((session) => session.id)).toEqual([
      "session-newer",
      "session-older",
    ]);
  });
});
