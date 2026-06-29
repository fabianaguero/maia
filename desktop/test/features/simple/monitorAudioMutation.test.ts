import { describe, expect, it } from "vitest";

import {
  buildMonitorTrackMutationPlan,
  resolveBurstFactor,
} from "../../../src/features/simple/monitorAudioMutation";

describe("monitorAudioMutation", () => {
  it("returns a neutral plan for clean info traffic", () => {
    const plan = buildMonitorTrackMutationPlan(
      {
        lineCount: 16,
        anomalyCount: 0,
        levelCounts: { info: 16 },
        anomalyMarkers: [],
      },
      0.35,
    );

    expect(plan.mode).toBe("neutral");
    expect(plan.nextPressure).toBeCloseTo(0.203, 3);
    expect(plan.filterHz).toBe(18000);
    expect(plan.driveWet).toBe(0.0001);
    expect(plan.deckGain).toBe(1);
  });

  it("returns an alert plan when warning pressure is present", () => {
    const plan = buildMonitorTrackMutationPlan(
      {
        lineCount: 16,
        anomalyCount: 2,
        levelCounts: { info: 12, warn: 3, error: 1 },
        anomalyMarkers: [
          { eventIndex: 4, level: "warn", component: "svc", excerpt: "slow" },
          { eventIndex: 5, level: "error", component: "svc", excerpt: "boom" },
        ],
      },
      0,
    );

    expect(plan.mode).toBe("alert");
    expect(plan.nextPressure).toBeGreaterThan(0);
    expect(plan.filterHz).toBeLessThan(21000);
    expect(plan.driveWet).toBeGreaterThan(0.0001);
    expect(plan.deckGain).toBeLessThan(1);
  });

  it("detects clustered markers as a burst", () => {
    const burst = resolveBurstFactor([
      { eventIndex: 10, level: "warn", component: "svc", excerpt: "a" },
      { eventIndex: 11, level: "error", component: "svc", excerpt: "b" },
      { eventIndex: 13, level: "error", component: "svc", excerpt: "c" },
    ]);

    expect(burst).toBeGreaterThan(0.18);
  });

  it("enables gate only on extreme sustained error pressure", () => {
    const plan = buildMonitorTrackMutationPlan(
      {
        lineCount: 4,
        anomalyCount: 4,
        levelCounts: { error: 4 },
        anomalyMarkers: [
          { eventIndex: 1, level: "error", component: "svc", excerpt: "a" },
          { eventIndex: 7, level: "error", component: "svc", excerpt: "b" },
          { eventIndex: 14, level: "error", component: "svc", excerpt: "c" },
          { eventIndex: 21, level: "error", component: "svc", excerpt: "d" },
        ],
      },
      0.98,
    );

    expect(plan.mode).toBe("alert");
    expect(plan.gateFloor).not.toBeNull();
  });
});
