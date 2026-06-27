import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimpleMonitorDeckVisualState } from "../../../src/features/simple/useSimpleMonitorDeckVisualState";

const state = vi.hoisted(() => ({
  scrub: {
    overviewCanvasRef: { current: null },
    waveformCanvasRef: { current: null },
    waveformStageRef: { current: null },
    seekToTrackProgress: vi.fn(),
    seekTrackFromOverviewViewport: vi.fn(),
    seekTrackFromViewport: vi.fn(),
    handleOverviewPointerDown: vi.fn(),
    handleOverviewClick: vi.fn(),
    handleOverviewAnomalyClick: vi.fn(),
    handleOverviewAnomalyPointerDown: vi.fn(),
    handleStagePointerDown: vi.fn(),
    handleStageClick: vi.fn(),
  },
  renderMonitorOverviewCanvas: vi.fn(),
  renderMonitorDeckCanvas: vi.fn(),
  useMonitorDeckScrub: vi.fn(() => state.scrub),
}));

vi.mock("../../../src/features/simple/useMonitorDeckScrub", () => ({
  useMonitorDeckScrub: state.useMonitorDeckScrub,
}));

vi.mock("../../../src/features/simple/monitorDeckCanvas", async () => {
  const actual = await vi.importActual("../../../src/features/simple/monitorDeckCanvas");
  return {
    ...actual,
    renderMonitorOverviewCanvas: state.renderMonitorOverviewCanvas,
    renderMonitorDeckCanvas: state.renderMonitorDeckCanvas,
  };
});

describe("useSimpleMonitorDeckVisualState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes derived deck state with scrub controls and skips canvas rendering in safe mode", () => {
    const { result } = renderHook(() =>
      useSimpleMonitorDeckVisualState({
        backgroundAudioRef: { current: null },
        waveformBins: new Array(64).fill(0.5),
        waveformAnomalies: [
          {
            id: "anomaly-1",
            lineId: "line-1",
            timestamp: "10:00:00",
            message: "timeout",
            severity: 0.8,
            progress: 0.25,
          },
        ],
        trackWaveProgress: 0.2,
        setTrackWaveProgress: vi.fn(),
        setTrackElapsedSeconds: vi.fn(),
        deckDurationSeconds: 240,
        deckBpm: 126,
        activeBeatGrid: [],
        logSignalBuffer: new Array(120).fill(null).map(() => ({ val: 20, heat: 0 })),
        selectedAnomalyId: "anomaly-1",
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        onSelectAnomalyForFocus: vi.fn(),
        deckVisualPreset: "balanced",
        waveformScale: 1.4,
        safeRuntime: true,
      }),
    );

    expect(state.useMonitorDeckScrub).toHaveBeenCalledWith(
      expect.objectContaining({
        trackWaveProgress: 0.2,
        isConsoleExpanded: false,
      }),
    );
    expect(result.current.overviewCanvasRef).toBe(state.scrub.overviewCanvasRef);
    expect(result.current.waveformStageRef).toBe(state.scrub.waveformStageRef);
    expect(result.current.visibleWindowSeconds).toBeGreaterThan(0);
    expect(Array.isArray(result.current.deckTimelineMarkers)).toBe(true);
    expect(Array.isArray(result.current.deckBeatMarkers)).toBe(true);
    expect(state.renderMonitorOverviewCanvas).not.toHaveBeenCalled();
    expect(state.renderMonitorDeckCanvas).not.toHaveBeenCalled();
  });
});
