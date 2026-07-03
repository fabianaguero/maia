import { describe, expect, it, vi } from "vitest";

import {
  applyResolvedBackgroundMutation,
  resolveBackgroundMutationTargets,
  shouldApplyForcedBackgroundMutation,
} from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundMutationEffectRuntime";

function createParam(value = 0) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

describe("liveLogMonitorBackgroundMutationEffectRuntime", () => {
  it("resolves active mutation targets from refs", () => {
    const targets = resolveBackgroundMutationTargets({
      audioContextRef: { current: { currentTime: 12 } as AudioContext },
      backgroundGainRef: { current: { gain: createParam(0.8) } as GainNode },
      backgroundDryGainRef: { current: { gain: createParam(1) } as GainNode },
      backgroundDriveWetGainRef: { current: { gain: createParam(0.2) } as GainNode },
      backgroundDriveNodeRef: { current: { curve: null } as WaveShaperNode },
      filterNodeRef: {
        current: { frequency: createParam(1200), Q: createParam(1) } as BiquadFilterNode,
      },
      backgroundDeckRef: {
        current: {
          source: { playbackRate: createParam(1) },
          gain: { gain: createParam(0.7) },
        } as never,
      },
    });

    expect(targets).not.toBeNull();
    expect(targets?.context.currentTime).toBe(12);
  });

  it("returns null when any target is missing", () => {
    expect(
      resolveBackgroundMutationTargets({
        audioContextRef: { current: null },
        backgroundGainRef: { current: null },
        backgroundDryGainRef: { current: null },
        backgroundDriveWetGainRef: { current: null },
        backgroundDriveNodeRef: { current: null },
        filterNodeRef: { current: null },
        backgroundDeckRef: { current: null },
      }),
    ).toBeNull();
  });

  it("applies resolved mutation plans against the active targets", () => {
    const buildAutomationPlan = vi.fn(() => ({ recoverAt: 12.2 }) as never);
    const applyAutomationPlan = vi.fn();
    const setLiveMutationState = vi.fn();
    const targets = resolveBackgroundMutationTargets({
      audioContextRef: { current: { currentTime: 12 } as AudioContext },
      backgroundGainRef: { current: { gain: createParam(0.8) } as GainNode },
      backgroundDryGainRef: { current: { gain: createParam(1) } as GainNode },
      backgroundDriveWetGainRef: { current: { gain: createParam(0.2) } as GainNode },
      backgroundDriveNodeRef: { current: { curve: null } as WaveShaperNode },
      filterNodeRef: {
        current: { frequency: createParam(1200), Q: createParam(1) } as BiquadFilterNode,
      },
      backgroundDeckRef: {
        current: {
          source: { playbackRate: createParam(1) },
          gain: { gain: createParam(0.7) },
        } as never,
      },
    });

    expect(
      applyResolvedBackgroundMutation({
        targets,
        mutation: { accent: "warn" } as never,
        nextState: "warning",
        setLiveMutationState,
        styleProfile: {
          backgroundGain: 0.8,
          filterCeilingHz: 1200,
        },
        buildAutomationPlan,
        applyAutomationPlan,
        createDriveCurve: vi.fn(() => "curve"),
      }),
    ).toBe(true);

    expect(setLiveMutationState).toHaveBeenCalledWith("warning");
    expect(buildAutomationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        now: 12,
        currentValues: expect.objectContaining({
          filterHz: 1200,
          deckGain: 0.7,
        }),
      }),
    );
    expect(applyAutomationPlan).toHaveBeenCalled();
  });

  it("skips mutation application without active targets", () => {
    expect(
      applyResolvedBackgroundMutation({
        targets: null,
        mutation: { accent: "warn" } as never,
        nextState: "warning",
        setLiveMutationState: vi.fn(),
        styleProfile: {
          backgroundGain: 0.8,
          filterCeilingHz: 1200,
        },
        buildAutomationPlan: vi.fn(),
        applyAutomationPlan: vi.fn(),
        createDriveCurve: vi.fn(),
      }),
    ).toBe(false);
  });

  it("only applies forced mutation when live mode, deck and forced state are present", () => {
    expect(
      shouldApplyForcedBackgroundMutation({
        liveEnabled: true,
        hasBackgroundDeck: true,
        forcedLiveMutationState: "critical",
      }),
    ).toBe(true);
    expect(
      shouldApplyForcedBackgroundMutation({
        liveEnabled: false,
        hasBackgroundDeck: true,
        forcedLiveMutationState: "critical",
      }),
    ).toBe(false);
    expect(
      shouldApplyForcedBackgroundMutation({
        liveEnabled: true,
        hasBackgroundDeck: false,
        forcedLiveMutationState: "critical",
      }),
    ).toBe(false);
    expect(
      shouldApplyForcedBackgroundMutation({
        liveEnabled: true,
        hasBackgroundDeck: true,
        forcedLiveMutationState: "auto",
      }),
    ).toBe(false);
  });
});
