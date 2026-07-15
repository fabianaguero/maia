import { describe, expect, it } from "vitest";

import {
  buildAnomalyBurstRegions,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
  buildMonitorDeckDerivedState,
  quantizeProgressToBeatGrid,
  resolveVisibleWindowSeconds,
} from "../../../src/features/simple/monitorDeckViewModel";

describe("monitorDeckViewModel", () => {
  it("quantizes progress against bpm when duration is known", () => {
    const quantized = quantizeProgressToBeatGrid(0.333, 120, 120, null, 0.25);

    expect(quantized).toBeCloseTo(0.333333, 5);
  });

  it("builds a centered deck timeline and beat markers", () => {
    const timelineMarkers = buildDeckTimelineMarkers(0.5, 180, 126, null);
    const beatMarkers = buildDeckBeatMarkers(0.5, 180, 126, null);

    expect(timelineMarkers).toHaveLength(7);
    expect(timelineMarkers[3]?.emphasis).toBe("playhead");
    expect(timelineMarkers[3]?.leftPercent).toBeCloseTo(50, 4);
    expect(beatMarkers.length).toBeGreaterThan(8);
    expect(resolveVisibleWindowSeconds(120, null)).toBe(16);
  });

  it("groups nearby anomalies into burst regions", () => {
    const regions = buildAnomalyBurstRegions([
      { id: "a", lineId: "1", timestamp: "t1", message: "warn", severity: 0.72, progress: 0.2 },
      { id: "b", lineId: "2", timestamp: "t2", message: "warn", severity: 0.78, progress: 0.214 },
      { id: "c", lineId: "3", timestamp: "t3", message: "crit", severity: 0.94, progress: 0.6 },
    ]);

    expect(regions).toHaveLength(2);
    expect(regions[0]).toMatchObject({ count: 2, severity: 0.78 });
    expect(regions[1]).toMatchObject({ count: 1, severity: 0.94 });
  });

  it("builds overview state and resolves selected burst from anomalies", () => {
    const visibleWindowSeconds = resolveVisibleWindowSeconds(126, null);
    const state = buildMonitorDeckDerivedState({
      waveformBins: [0.2, 0.4, 0.7, 0.3, 0.9, 0.5],
      waveformAnomalies: [
        {
          id: "a",
          lineId: "1",
          timestamp: "2026-01-01T10:00:00Z",
          message: "warn",
          severity: 0.8,
          progress: 0.25,
        },
        {
          id: "b",
          lineId: "2",
          timestamp: "2026-01-01T10:00:02Z",
          message: "crit",
          severity: 0.95,
          progress: 0.27,
        },
        {
          id: "c",
          lineId: "3",
          timestamp: "2026-01-01T10:00:04Z",
          message: "warn",
          severity: 0.72,
          progress: 1.2,
        },
      ],
      trackWaveProgress: 0.5,
      deckDurationSeconds: 180,
      visibleWindowSeconds,
      logSignalBuffer: [
        { val: 20, heat: 0 },
        { val: 70, heat: 0.5 },
        { val: 120, heat: 1 },
      ],
      selectedAnomalyId: "b",
    });

    expect(state.overviewWaveSamples).toHaveLength(320);
    expect(state.logWaveOverlay).toHaveLength(420);
    expect(state.overviewAnomalyMarkers).toHaveLength(2);
    expect(state.selectedDeckMarker?.id).toBe("b");
    expect(state.selectedBurstRegion?.count).toBe(2);
    expect(state.overviewWindowWidthPercent).toBeGreaterThan(0);
    expect(state.overviewPlayheadLeftPercent).toBeCloseTo(50, 4);
  });
});
