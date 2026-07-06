import { describe, expect, it, vi } from "vitest";

import { buildMonitorDeckScrubHookState } from "../../../src/features/simple/monitorDeckScrubHookStateRuntime";

describe("monitorDeckScrubHookStateRuntime", () => {
  it("merges refs, callbacks and interaction handlers into the public hook state", () => {
    const input = {
      overviewCanvasRef: { current: null },
      waveformCanvasRef: { current: null },
      waveformStageRef: { current: null },
      seekToTrackProgress: vi.fn(),
      seekTrackFromOverviewViewport: vi.fn(),
      seekTrackFromViewport: vi.fn(),
      interactionHandlers: {
        handleOverviewPointerDown: vi.fn(),
        handleOverviewClick: vi.fn(),
        handleOverviewAnomalyClick: vi.fn(),
        handleOverviewAnomalyPointerDown: vi.fn(),
        handleStagePointerDown: vi.fn(),
        handleStageClick: vi.fn(),
      },
    };

    const result = buildMonitorDeckScrubHookState(input);

    expect(result.overviewCanvasRef).toBe(input.overviewCanvasRef);
    expect(result.seekTrackFromViewport).toBe(input.seekTrackFromViewport);
    expect(result.handleStageClick).toBe(input.interactionHandlers.handleStageClick);
  });
});
