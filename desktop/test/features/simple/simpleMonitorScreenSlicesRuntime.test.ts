import { describe, expect, it, vi } from "vitest";

import {
  buildSimpleMonitorDeckRuntimeSlice,
  buildSimpleMonitorLaunchStateSlice,
} from "../../../src/features/simple/simpleMonitorScreenSlicesRuntime";

describe("simpleMonitorScreenSlicesRuntime", () => {
  it("keeps launch-state slice wiring stable", () => {
    const launchState = {
      selectedSoundId: "track-1",
      setSelectedSoundId: vi.fn(),
      filteredMonitorSourceOptions: [{ id: "repo-1" }],
      selectedSourceOption: { id: "repo-1" },
      canStartSelectedSource: true,
      sourceEmptyMessage: "No sources",
      startHint: "Ready",
      selectedSourceId: "repo-1",
      setSelectedSourceId: vi.fn(),
      sourceFilter: "all",
      setSourceFilter: vi.fn(),
      isLaunchingMonitor: false,
      handleStartMonitoringRequest: vi.fn(),
    } as never;

    expect(buildSimpleMonitorLaunchStateSlice(launchState)).toEqual(launchState);
  });

  it("keeps deck-runtime slice wiring stable", () => {
    const deckRuntime = {
      activeTrack: { id: "track-1" },
      previewTrackId: null,
      toggleTrackPreview: vi.fn(),
      deckPresetLabel: "Balanced",
      streamAdapterLabel: "FILE_TAIL",
      isMonitorActive: true,
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
    } as never;

    expect(buildSimpleMonitorDeckRuntimeSlice(deckRuntime)).toEqual(deckRuntime);
  });
});
