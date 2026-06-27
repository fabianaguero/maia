import { describe, expect, it } from "vitest";

import type { MonitorTrackMutationPlan } from "../../../src/features/simple/monitorAudioMutation";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  buildAdjustedMonitorTrackMutationPlan,
  createDriveCurve,
  resolveMonitorAlertShapeProfile,
} from "../../../src/features/simple/monitorTrackMutationRuntime";

const basePlan: MonitorTrackMutationPlan = {
  mode: "alert",
  nextPressure: 0.42,
  burstFactor: 0.35,
  filterHz: 12600,
  filterQ: 1.18,
  outputGain: 0.88,
  dryGain: 0.96,
  driveWet: 0.03,
  deckGain: 0.98,
  driveCurveAmount: 1.24,
  playbackRate: 1,
  sustainedBurst: false,
  recoverAtOffsetSec: 2.9,
  transitionSec: 0.28,
  gateFloor: 0.965,
};

describe("monitorTrackMutationRuntime", () => {
  it("creates a symmetric drive curve", () => {
    const curve = createDriveCurve(1.8);

    expect(curve).toHaveLength(2048);
    expect(curve[0]).toBeLessThan(0);
    expect(curve[curve.length - 1]).toBeGreaterThan(0);
    expect(Math.abs(curve[Math.floor(curve.length / 2)])).toBeLessThan(0.01);
  });

  it("resolves alert-shape profiles deterministically", () => {
    expect(resolveMonitorAlertShapeProfile("soft")).toMatchObject({
      filter: 0.58,
      transition: 1.12,
    });
    expect(resolveMonitorAlertShapeProfile("tight")).toMatchObject({
      filter: 1,
      transition: 1,
    });
    expect(resolveMonitorAlertShapeProfile("aggressive")).toMatchObject({
      filter: 1.18,
      transition: 0.88,
    });
  });

  it("adjusts an alert plan using deck controls", () => {
    const adjusted = buildAdjustedMonitorTrackMutationPlan({
      plan: basePlan,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
    });

    expect(adjusted.nextPressure).toBe(basePlan.nextPressure);
    expect(adjusted.filterHz).toBeLessThan(18000);
    expect(adjusted.driveWet).toBeGreaterThan(0.0001);
    expect(adjusted.driveCurveAmount).toBeGreaterThan(1.02);
    expect(adjusted.recoverAtOffsetSec).toBeGreaterThan(0.22);
    expect(adjusted.gateFloor).not.toBeNull();
  });

  it("keeps gate floor null when the source plan has no gate", () => {
    const softAdjusted = buildAdjustedMonitorTrackMutationPlan({
      plan: {
        ...basePlan,
        gateFloor: null,
      },
      controls: {
        ...DEFAULT_MONITOR_DECK_CONTROLS,
        alertShape: "soft",
      },
    });

    const tightAdjusted = buildAdjustedMonitorTrackMutationPlan({
      plan: {
        ...basePlan,
        gateFloor: null,
      },
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
    });

    expect(softAdjusted.gateFloor).toBeNull();
    expect(softAdjusted.transitionSec).toBeGreaterThan(tightAdjusted.transitionSec);
  });
});
