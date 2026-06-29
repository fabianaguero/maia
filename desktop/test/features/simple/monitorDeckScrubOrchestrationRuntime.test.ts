import { describe, expect, it } from "vitest";

import {
  buildDeckScrubPointerState,
  buildOverviewScrubPointerState,
  resolveMonitorDeckSeekState,
  resolveStoppedMonitorScrubPointerState,
  shouldProcessMonitorScrubPointer,
} from "../../../src/features/simple/monitorDeckScrubOrchestrationRuntime";

describe("monitorDeckScrubOrchestrationRuntime", () => {
  it("resolves seek state and nearby anomaly focus deterministically", () => {
    const audio = {
      duration: 240,
      currentTime: 0,
    } as HTMLAudioElement;

    const seekState = resolveMonitorDeckSeekState({
      audio,
      nextProgress: 0.25,
      waveformAnomalies: [
        {
          id: "marker-1",
          lineId: "line-1",
          timestamp: "10:00:00",
          message: "warn",
          severity: 0.7,
          progress: 0.24,
        },
      ],
      isConsoleExpanded: false,
    });

    expect(seekState).toEqual({
      clampedProgress: 0.25,
      currentTime: 60,
      focusedAnomalyId: "marker-1",
      shouldOpenConsole: true,
    });
    expect(
      resolveMonitorDeckSeekState({
        audio: null,
        nextProgress: 0.5,
        waveformAnomalies: [],
        isConsoleExpanded: true,
      }),
    ).toBeNull();
  });

  it("builds pointer state for overview and deck scrubbing", () => {
    expect(buildOverviewScrubPointerState(7)).toEqual({
      isScrubbing: true,
      activePointerId: 7,
    });

    const deckState = buildDeckScrubPointerState({
      pointerId: 11,
      clientX: 140,
      left: 100,
      width: 400,
      trackWaveProgress: 0.25,
    });

    expect(deckState.isScrubbing).toBe(true);
    expect(deckState.activePointerId).toBe(11);
    expect(deckState.startProgress).toBe(0.25);
    expect(deckState.startRatio).toBeGreaterThan(0);
  });

  it("guards pointer move processing and stop state transitions", () => {
    expect(
      shouldProcessMonitorScrubPointer({
        isScrubbing: true,
        activePointerId: 5,
        eventPointerId: 5,
      }),
    ).toBe(true);
    expect(
      shouldProcessMonitorScrubPointer({
        isScrubbing: true,
        activePointerId: 5,
        eventPointerId: 6,
      }),
    ).toBe(false);

    expect(
      resolveStoppedMonitorScrubPointerState({
        activePointerId: 7,
        eventPointerId: 7,
      }),
    ).toEqual({
      isScrubbing: false,
      activePointerId: null,
      didStop: true,
    });
    expect(
      resolveStoppedMonitorScrubPointerState({
        activePointerId: 7,
        eventPointerId: 9,
      }),
    ).toEqual({
      isScrubbing: true,
      activePointerId: 7,
      didStop: false,
    });
  });
});
