import { describe, expect, it } from "vitest";

import { MONITOR_TRACK_WINDOW_POINTS } from "../../../src/features/simple/monitorDeckTypes";
import {
  buildAnomalyBurstRegions,
  buildMonitorDeckDerivedState,
  sampleLogWaveOverlay,
  sampleOverviewAnomalyDensity,
} from "../../../src/features/simple/monitorDeckAnomalyRuntime";

const markers = [
  {
    id: "warn-1",
    lineId: "line-1",
    timestamp: "2026-06-30T12:00:00.000Z",
    message: "warn",
    severity: 0.7,
    progress: 0.2,
  },
  {
    id: "crit-1",
    lineId: "line-2",
    timestamp: "2026-06-30T12:00:02.000Z",
    message: "crit",
    severity: 0.95,
    progress: 0.22,
  },
  {
    id: "warn-2",
    lineId: "line-3",
    timestamp: "2026-06-30T12:00:04.000Z",
    message: "warn-2",
    severity: 0.6,
    progress: 0.75,
  },
];

describe("monitorDeckAnomalyRuntime", () => {
  it("samples overview anomaly density for empty, warning and critical regions", () => {
    const empty = sampleOverviewAnomalyDensity([], 4);
    const density = sampleOverviewAnomalyDensity(markers, 5);

    expect(empty).toEqual([
      { warning: 0, critical: 0 },
      { warning: 0, critical: 0 },
      { warning: 0, critical: 0 },
      { warning: 0, critical: 0 },
    ]);
    expect(density).toHaveLength(5);
    expect(density.some((point) => point.warning > 0)).toBe(true);
    expect(density.some((point) => point.critical > 0)).toBe(true);
    expect(density.every((point) => point.warning <= 1 && point.critical <= 1)).toBe(true);
  });

  it("groups nearby anomaly markers into padded burst regions", () => {
    expect(buildAnomalyBurstRegions([])).toEqual([]);

    const regions = buildAnomalyBurstRegions(markers, 0.03, 0.01);

    expect(regions).toHaveLength(2);
    expect(regions[0]).toEqual(
      expect.objectContaining({
        id: "burst-0-0.2000",
        startProgress: 0.19,
        endProgress: 0.23,
        severity: 0.95,
        count: 2,
      }),
    );
    expect(regions[1]).toEqual(
      expect.objectContaining({
        id: "burst-1-0.7500",
        startProgress: 0.74,
        endProgress: 0.76,
        severity: 0.6,
        count: 1,
      }),
    );
  });

  it("samples the log wave overlay with interpolation, clamps and empty defaults", () => {
    const empty = sampleLogWaveOverlay([], 3);
    const sampled = sampleLogWaveOverlay(
      [
        { val: 10, heat: -0.3 },
        { val: 210, heat: 1.3 },
      ],
      3,
    );

    expect(empty).toEqual([
      { level: 0.08, heat: 0 },
      { level: 0.08, heat: 0 },
      { level: 0.08, heat: 0 },
    ]);
    expect(sampled[0]).toEqual({ level: 0.07142857142857142, heat: 0 });
    expect(sampled[1]).toEqual({ level: 0.7857142857142857, heat: 0.5 });
    expect(sampled[2]).toEqual({ level: 1, heat: 1 });
  });

  it("builds derived deck state for bounded and unbounded timeline contexts", () => {
    const sampleOverviewWave = (bins: number[] | null | undefined) =>
      bins ? bins.map((bin) => bin * 2) : [0.1];

    const bounded = buildMonitorDeckDerivedState({
      waveformBins: [0.2, 0.4],
      waveformAnomalies: [...markers, { ...markers[0], id: "hidden-left", progress: -0.2 }],
      trackWaveProgress: 0.5,
      deckDurationSeconds: 200,
      visibleWindowSeconds: 50,
      logSignalBuffer: [{ val: 42, heat: 0.3 }],
      selectedAnomalyId: "crit-1",
      sampleOverviewWave,
    });

    expect(bounded.overviewWaveSamples).toEqual([0.4, 0.8]);
    expect(bounded.overviewWindowWidthPercent).toBe(25);
    expect(bounded.overviewWindowLeftPercent).toBe(37.5);
    expect(bounded.overviewPlayheadLeftPercent).toBe(50);
    expect(bounded.logWaveOverlay).toHaveLength(MONITOR_TRACK_WINDOW_POINTS);
    expect(bounded.overviewAnomalyMarkers).toHaveLength(3);
    expect(bounded.selectedDeckMarker?.id).toBe("crit-1");
    expect(bounded.selectedBurstRegion?.count).toBe(2);

    const unbounded = buildMonitorDeckDerivedState({
      waveformBins: null,
      waveformAnomalies: [],
      trackWaveProgress: 0.42,
      deckDurationSeconds: null,
      visibleWindowSeconds: 50,
      logSignalBuffer: [],
      selectedAnomalyId: null,
      sampleOverviewWave,
    });

    expect(unbounded.overviewWaveSamples).toEqual([0.1]);
    expect(unbounded.overviewWindowWidthPercent).toBe(0);
    expect(unbounded.overviewWindowLeftPercent).toBe(0);
    expect(unbounded.overviewPlayheadLeftPercent).toBe(42);
    expect(unbounded.selectedDeckMarker).toBeNull();
    expect(unbounded.selectedBurstRegion).toBeNull();
  });
});
