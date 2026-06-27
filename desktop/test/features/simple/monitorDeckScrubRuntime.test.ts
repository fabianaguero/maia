import { describe, expect, it } from "vitest";

import {
  clampMonitorProgress,
  resolveDeckScrubProgress,
  resolveNearestMonitorAnomalyMarker,
  resolveOverviewScrubProgress,
  shouldFocusMonitorAnomalyMarker,
} from "../../../src/features/simple/monitorDeckScrubRuntime";

const markers = [
  {
    id: "marker-1",
    lineId: "line-1",
    timestamp: "10:00:00",
    message: "warn",
    severity: 0.7,
    progress: 0.24,
  },
  {
    id: "marker-2",
    lineId: "line-2",
    timestamp: "10:00:02",
    message: "error",
    severity: 1,
    progress: 0.7,
  },
];

describe("monitorDeckScrubRuntime", () => {
  it("clamps monitor progress to the 0..1 range", () => {
    expect(clampMonitorProgress(-0.2)).toBe(0);
    expect(clampMonitorProgress(0.4)).toBe(0.4);
    expect(clampMonitorProgress(1.2)).toBe(1);
  });

  it("resolves nearest markers and focus threshold", () => {
    const nearest = resolveNearestMonitorAnomalyMarker(markers, 0.26);

    expect(nearest?.id).toBe("marker-1");
    expect(shouldFocusMonitorAnomalyMarker(nearest, 0.26)).toBe(true);
    expect(shouldFocusMonitorAnomalyMarker(nearest, 0.4)).toBe(false);
    expect(shouldFocusMonitorAnomalyMarker(null, 0.4)).toBe(false);
  });

  it("resolves overview and deck scrub progress from viewport math", () => {
    expect(
      resolveOverviewScrubProgress({
        clientX: 75,
        left: 25,
        width: 100,
      }),
    ).toBe(0.5);

    const deckProgress = resolveDeckScrubProgress({
      clientX: 80,
      left: 0,
      width: 100,
      startRatio: 0.5,
      startProgress: 0.3,
    });

    expect(deckProgress).toBeGreaterThan(0.3);
    expect(deckProgress).toBeLessThanOrEqual(1);
  });
});
