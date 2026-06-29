import { describe, expect, it } from "vitest";

import {
  buildBackgroundMutationAutomationPlan,
  resolveLiveBackgroundMutation,
} from "../../src/features/analyzer/components/liveLogMonitorMutationRuntime";

describe("liveLogMonitorMutationRuntime", () => {
  it("resolves computed vs forced live mutation state", () => {
    const resolved = resolveLiveBackgroundMutation({
      update: {
        hasData: true,
        lines: [],
        lineCount: 10,
        anomalyCount: 4,
        levelCounts: { WARN: 2, ERROR: 2 },
        dominantLevel: "ERROR",
        topComponents: [],
        anomalyMarkers: [],
        sonificationCues: [],
        suggestedBpm: 126,
        sourceOffset: null,
        targetOffset: null,
      },
      styleProfile: {
        backgroundGain: 0.5,
        filterBaseHz: 240,
        filterCeilingHz: 12000,
      },
      mutationProfile: {
        backgroundDucking: 0.3,
        filterSweepMultiplier: 1.2,
        anomalyBoostMultiplier: 1.1,
        transitionTightness: 0.6,
      },
      forcedLiveMutationState: "auto",
    });

    expect(resolved.nextState).toMatch(/normal|warning|critical/);
    expect(resolved.mutation).toEqual(resolved.computedMutation);

    const forced = resolveLiveBackgroundMutation({
      update: {
        hasData: true,
        lines: [],
        lineCount: 10,
        anomalyCount: 0,
        levelCounts: {},
        dominantLevel: "INFO",
        topComponents: [],
        anomalyMarkers: [],
        sonificationCues: [],
        suggestedBpm: 126,
        sourceOffset: null,
        targetOffset: null,
      },
      styleProfile: {
        backgroundGain: 0.5,
        filterBaseHz: 240,
        filterCeilingHz: 12000,
      },
      mutationProfile: {
        backgroundDucking: 0.3,
        filterSweepMultiplier: 1.2,
        anomalyBoostMultiplier: 1.1,
        transitionTightness: 0.6,
      },
      forcedLiveMutationState: "critical",
    });

    expect(forced.nextState).toBe("critical");
    expect(forced.mutation.driveWet).toBeGreaterThan(0.5);
  });

  it("builds a recoverable automation plan with gate pulses", () => {
    const plan = buildBackgroundMutationAutomationPlan({
      now: 12,
      mutation: {
        filterHz: 800,
        filterQ: 4,
        busGain: 0.2,
        deckGain: 0.7,
        driveWet: 0.5,
        playbackRate: 0.96,
        gateDepth: 0.4,
        gatePulses: 2,
        recoverSeconds: 1.1,
      },
      styleProfile: {
        backgroundGain: 0.45,
        filterCeilingHz: 14000,
      },
      currentValues: {
        filterHz: 2000,
        filterQ: 1.2,
        backgroundGain: 0.5,
        dryGain: 1,
        wetGain: 0.0001,
        playbackRate: 1,
        deckGain: 1,
      },
    });

    expect(plan.recoverAt).toBeCloseTo(13.1);
    expect(plan.filter.targetHz).toBe(800);
    expect(plan.busGain.target).toBe(0.2);
    expect(plan.deckPlaybackRate.target).toBe(0.96);
    expect(plan.gatePulses).toHaveLength(2);
    expect(plan.driveCurveAmount).toBeGreaterThan(1.4);
  });
});
