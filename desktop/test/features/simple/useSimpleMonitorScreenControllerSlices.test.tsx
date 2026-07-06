import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useSimpleMonitorScreenControllerSlices } from "../../../src/features/simple/useSimpleMonitorScreenControllerSlices";

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

describe("useSimpleMonitorScreenControllerSlices", () => {
  it("composes launch, deck and anomaly slices behind one hook seam", () => {
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
      activeTrack: { id: "track-1" },
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
        useSimpleMonitorScreenControllerSlices({
          state: {
            skin: "copper",
            session: null,
            metrics: { windowCount: 3, processedLines: 24, totalAnomalies: 2 },
            pastSessions: [],
            repositories: [],
            tracks: [],
            onStop: vi.fn(),
            onResumeAudio: vi.fn(),
            audioStatus: "running",
            audioContext: null,
            onStartMonitoring: vi.fn(),
            onReplaySession: vi.fn(),
            subscribe: vi.fn(() => () => {}),
            isConsoleExpanded: false,
            onToggleConsole: vi.fn(),
            liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
          },
          collections: {
            safePastSessions: [],
            safeRepositories: [],
            safeTracks: [],
          },
          isListening: false,
          t: en,
        }),
      { wrapper },
    );

    expect(result.current.launchState.startHint).toBe("Ready");
    expect(result.current.deckRuntime.deckBpm).toBe(126);
    expect(result.current.anomalyFilter.isAnomalyFilterActive).toBe(false);
  });
});
