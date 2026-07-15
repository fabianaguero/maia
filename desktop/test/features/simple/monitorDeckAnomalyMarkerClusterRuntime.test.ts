import { describe, expect, it } from "vitest";

import { clusterVisibleStreamAnomalyMarkers } from "../../../src/features/simple/monitorDeckAnomalyMarkerClusterRuntime";

describe("monitorDeckAnomalyMarkerClusterRuntime", () => {
  it("groups nearby anomalies and preserves the most severe representative", () => {
    const clusters = clusterVisibleStreamAnomalyMarkers({
      markers: [
        {
          id: "warn",
          progress: 0.5,
          severity: 0.72,
          timestamp: "10:00:00",
          message: "slow",
          leftPercent: 50,
        },
        {
          id: "error",
          progress: 0.507,
          severity: 1,
          timestamp: "10:00:01",
          message: "failed",
          leftPercent: 50.7,
        },
      ],
      currentProgress: 0,
      selectedAnomalyId: "warn",
      resolveRelativePosition: (progress) => progress,
      isVisible: () => true,
    });

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      count: 2,
      containsSelected: true,
      marker: expect.objectContaining({ id: "error" }),
    });
  });
});
