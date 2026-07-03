import { describe, expect, it, vi } from "vitest";

import { applyBackgroundMutationAutomationPlan } from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundMutationApplyRuntime";

function createParam(value = 0) {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

describe("liveLogMonitorBackgroundMutationApplyRuntime", () => {
  it("applies automation ramps and gate pulses across the background deck graph", () => {
    const filter = {
      frequency: createParam(1200),
      Q: createParam(1),
    };
    const backgroundGain = { gain: createParam(0.8) };
    const dryGain = { gain: createParam(1) };
    const driveWetGain = { gain: createParam(0.0001) };
    const driveNode = { curve: null as Float32Array<ArrayBuffer> | null };
    const activeDeck = {
      source: { playbackRate: createParam(1) },
      gain: { gain: createParam(0.7) },
    };
    const curve = new Float32Array(16) as Float32Array<ArrayBuffer>;

    applyBackgroundMutationAutomationPlan({
      now: 12,
      filter,
      backgroundGain,
      dryGain,
      driveWetGain,
      driveNode,
      activeDeck,
      automationPlan: {
        filter: {
          startHz: 1200,
          targetHz: 800,
          recoverHz: 1100,
          startQ: 1,
          targetQ: 5,
          recoverQ: 1.2,
        },
        busGain: { start: 0.8, target: 0.55, recover: 0.8 },
        dryGain: { start: 1, target: 0.7, recover: 1 },
        wetGain: { start: 0.0001, target: 0.3, recover: 0.0001 },
        driveCurveAmount: 1.8,
        deckPlaybackRate: { start: 1, target: 0.96, recover: 1 },
        deckGain: { start: 0.7, target: 0.45, recover: 0.7 },
        gatePulses: [{ at: 12.03, recoverAt: 12.05, gateFloor: 0.2 }],
        recoverAt: 12.2,
      },
      createDriveCurve: vi.fn(() => curve),
    });

    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 12);
    expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(800, 12.06);
    expect(backgroundGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.55, 12.04);
    expect(dryGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.7, 12.04);
    expect(driveWetGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, 12.04);
    expect(activeDeck.source.playbackRate.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.96,
      12.05,
    );
    expect(activeDeck.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 12.03);
    expect(activeDeck.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.7, 12.2);
    expect(driveNode.curve).toBe(curve);
  });
});
