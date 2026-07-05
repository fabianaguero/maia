import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorScreenControllerAnomalyFilterArgs,
  buildSimpleMonitorScreenControllerCollectionsInput,
  buildSimpleMonitorScreenControllerHookArgsInput,
  buildSimpleMonitorScreenControllerHookBaseArgs,
  buildSimpleMonitorScreenControllerHookInteractiveArgs,
  buildSimpleMonitorScreenControllerDeckRuntimeInput,
  buildSimpleMonitorScreenControllerDeckHookArgs,
  buildSimpleMonitorScreenControllerLaunchStateInput,
  buildSimpleMonitorScreenControllerLaunchHookArgs,
  buildSimpleMonitorScreenControllerSlicesResult,
} from "../../../src/features/simple/simpleMonitorScreenControllerHookRuntime";
import { en } from "../../../src/i18n/en";

function createInput() {
  return {
    skin: "copper",
    session: null,
    metrics: {
      windowCount: 2,
      processedLines: 12,
      totalAnomalies: 3,
    },
    pastSessions: [{ id: "session-1" }],
    repositories: [{ id: "repo-1" }],
    tracks: [{ id: "track-1" }],
    onStop: vi.fn(),
    onResumeAudio: vi.fn(),
    audioStatus: "running" as const,
    audioContext: null,
    onStartMonitoring: vi.fn(),
    onReplaySession: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    trackName: "Deck Track",
    waveformBins: [0.1, 0.2],
    isConsoleExpanded: false,
    onToggleConsole: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  } as never;
}

describe("simpleMonitorScreenControllerHookRuntime", () => {
  it("builds collection, launch, deck, and anomaly-filter args from controller state", () => {
    const input = createInput();
    const collections = {
      safePastSessions: input.pastSessions,
      safeRepositories: input.repositories,
      safeTracks: input.tracks,
    } as never;

    expect(buildSimpleMonitorScreenControllerCollectionsInput(input)).toEqual({
      pastSessions: input.pastSessions,
      repositories: input.repositories,
      tracks: input.tracks,
    });

    expect(
      buildSimpleMonitorScreenControllerLaunchHookArgs({
        collections,
        isListening: false,
        t: en,
        onResumeAudio: input.onResumeAudio,
        onStartMonitoring: input.onStartMonitoring,
      }),
    ).toEqual({
      repositories: input.repositories,
      isListening: false,
      t: en,
      onResumeAudio: input.onResumeAudio,
      onStartMonitoring: input.onStartMonitoring,
    });

    expect(
      buildSimpleMonitorScreenControllerDeckHookArgs({
        state: input,
        isListening: false,
        isLaunchingMonitor: true,
        collections,
        t: en,
      }),
    ).toEqual(
      expect.objectContaining({
        skin: "copper",
        safeTracks: input.tracks,
        isLaunchingMonitor: true,
        t: en,
      }),
    );

    expect(buildSimpleMonitorScreenControllerAnomalyFilterArgs(input)).toEqual({
      isConsoleExpanded: false,
      onToggleConsole: input.onToggleConsole,
    });

    expect(
      buildSimpleMonitorScreenControllerLaunchStateInput({
        state: input,
        collections,
        isListening: false,
        t: en,
      }),
    ).toEqual({
      repositories: input.repositories,
      isListening: false,
      t: en,
      onResumeAudio: input.onResumeAudio,
      onStartMonitoring: input.onStartMonitoring,
    });

    expect(
      buildSimpleMonitorScreenControllerDeckRuntimeInput(
        {
          state: input,
          collections,
          isListening: false,
          t: en,
        },
        { isLaunchingMonitor: true },
      ),
    ).toEqual(
      expect.objectContaining({
        skin: "copper",
        safeTracks: input.tracks,
        isLaunchingMonitor: true,
        t: en,
      }),
    );
  });

  it("returns a stable slices result envelope", () => {
    const launchState = {
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
      handleStartMonitoringRequest: vi.fn(async () => undefined),
    } as never;
    const deckRuntime = {
      activeTrack: null,
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
      trackElapsedSeconds: 12,
      deckDurationSeconds: 240,
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      anomalyBurstRegions: [],
      selectedBurstRegion: null,
      overviewAnomalyMarkers: [],
      overviewWindowLeftPercent: 0.1,
      overviewWindowWidthPercent: 0.2,
      overviewPlayheadLeftPercent: 0.15,
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
    } as never;
    const anomalyFilter = {
      isAnomalyFilterActive: false,
      handleToggleAnomalyFilter: vi.fn(),
      handleClearAnomalyFilter: vi.fn(),
    };

    expect(
      buildSimpleMonitorScreenControllerSlicesResult({
        launchState,
        deckRuntime,
        anomalyFilter,
      }),
    ).toEqual({
      launchState,
      deckRuntime,
      anomalyFilter,
    });

    expect(
      buildSimpleMonitorScreenControllerHookBaseArgs({
        state: createInput(),
        t: en,
        nowMs: 1234,
        onRefresh: vi.fn(),
        launchState,
        deckRuntime,
        anomalyFilter,
        collections: {
          safePastSessions: [],
          safeRepositories: [],
          safeTracks: [],
        } as never,
      }),
    ).toEqual(
      expect.objectContaining({
        nowMs: 1234,
        audioStatus: "running",
      }),
    );

    expect(
      buildSimpleMonitorScreenControllerHookInteractiveArgs({
        launchState,
        deckRuntime,
        anomalyFilter,
        collections: {
          safePastSessions: [],
          safeRepositories: [],
          safeTracks: [],
        } as never,
      }),
    ).toEqual(
      expect.objectContaining({
        launchState,
        deckRuntime,
        isAnomalyFilterActive: false,
        onToggleAnomalyFilter: anomalyFilter.handleToggleAnomalyFilter,
        onClearAnomalyFilter: anomalyFilter.handleClearAnomalyFilter,
      }),
    );

    expect(
      buildSimpleMonitorScreenControllerHookArgsInput({
        state: createInput(),
        t: en,
        nowMs: 1234,
        onRefresh: vi.fn(),
        launchState,
        deckRuntime,
        anomalyFilter,
        collections: {
          safePastSessions: [],
          safeRepositories: [],
          safeTracks: [],
        } as never,
      }),
    ).toEqual(
      expect.objectContaining({
        nowMs: 1234,
        launchState,
        deckRuntime,
        isAnomalyFilterActive: false,
        onToggleAnomalyFilter: anomalyFilter.handleToggleAnomalyFilter,
        onClearAnomalyFilter: anomalyFilter.handleClearAnomalyFilter,
        audioStatus: "running",
      }),
    );
  });
});
