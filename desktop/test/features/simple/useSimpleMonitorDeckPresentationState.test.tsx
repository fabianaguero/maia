import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSimpleMonitorDeckPresentationState } from "../../../src/features/simple/useSimpleMonitorDeckPresentationState";

const state = vi.hoisted(() => ({
  liveTail: {
    terminalLinesRef: { current: null },
    onTerminalScroll: vi.fn(),
    registerLineRef: vi.fn(),
    focusAnomaly: vi.fn(),
  },
  visualState: {
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
    overviewWindowWidthPercent: 20,
    overviewWindowLeftPercent: 10,
    overviewPlayheadLeftPercent: 15,
    overviewAnomalyMarkers: [],
    selectedDeckMarker: null,
    selectedBurstRegion: null,
    deckTimelineMarkers: [],
    deckBeatMarkers: [],
  },
  useSimpleMonitorLiveTail: vi.fn(() => state.liveTail),
  useSimpleMonitorDeckVisualState: vi.fn(() => state.visualState),
}));

vi.mock("../../../src/features/simple/useSimpleMonitorLiveTail", () => ({
  useSimpleMonitorLiveTail: state.useSimpleMonitorLiveTail,
}));

vi.mock("../../../src/features/simple/useSimpleMonitorDeckVisualState", () => ({
  useSimpleMonitorDeckVisualState: state.useSimpleMonitorDeckVisualState,
}));

describe("useSimpleMonitorDeckPresentationState", () => {
  it("composes live tail state with deck visual state", () => {
    const setSelectedAnomalyId = vi.fn();
    const { result } = renderHook(() =>
      useSimpleMonitorDeckPresentationState({
        backgroundAudioRef: { current: null },
        waveformBins: [0.1, 0.3],
        waveformAnomalies: [],
        trackWaveProgress: 0.2,
        setTrackWaveProgress: vi.fn(),
        setTrackElapsedSeconds: vi.fn(),
        deckDurationSeconds: 180,
        deckBpm: 126,
        activeBeatGrid: [],
        logSignalBuffer: [],
        selectedAnomalyId: "anomaly-1",
        setSelectedAnomalyId,
        liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        deckVisualPreset: "balanced",
        waveformScale: 1,
        safeRuntime: true,
      }),
    );

    expect(state.useSimpleMonitorLiveTail).toHaveBeenCalledWith({
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      selectedAnomalyId: "anomaly-1",
      onSelectAnomalyId: setSelectedAnomalyId,
    });
    expect(state.useSimpleMonitorDeckVisualState).toHaveBeenCalledWith({
      backgroundAudioRef: { current: null },
      waveformBins: [0.1, 0.3],
      waveformAnomalies: [],
      trackWaveProgress: 0.2,
      setTrackWaveProgress: expect.any(Function),
      setTrackElapsedSeconds: expect.any(Function),
      deckDurationSeconds: 180,
      deckBpm: 126,
      activeBeatGrid: [],
      logSignalBuffer: [],
      selectedAnomalyId: "anomaly-1",
      isConsoleExpanded: false,
      onToggleConsole: expect.any(Function),
      onSelectAnomalyForFocus: state.liveTail.focusAnomaly,
      deckVisualPreset: "balanced",
      waveformScale: 1,
      safeRuntime: true,
    });
    expect(result.current.focusAnomaly).toBe(state.liveTail.focusAnomaly);
    expect(result.current.overviewWindowLeftPercent).toBe(10);
  });
});
