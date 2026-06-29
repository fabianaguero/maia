import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorBackgroundAudioEngine } from "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundAudioEngine";

const {
  createDriveCurveMock,
  forceBackgroundMutationProfileMock,
  buildBackgroundMutationAutomationPlanMock,
  resolveLiveBackgroundMutationMock,
} = vi.hoisted(() => ({
  createDriveCurveMock: vi.fn(),
  forceBackgroundMutationProfileMock: vi.fn(),
  buildBackgroundMutationAutomationPlanMock: vi.fn(),
  resolveLiveBackgroundMutationMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  createDriveCurve: (...args: unknown[]) => createDriveCurveMock(...args),
  forceBackgroundMutationProfile: (...args: unknown[]) =>
    forceBackgroundMutationProfileMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorMutationRuntime", () => ({
  buildBackgroundMutationAutomationPlan: (...args: unknown[]) =>
    buildBackgroundMutationAutomationPlanMock(...args),
  resolveLiveBackgroundMutation: (...args: unknown[]) => resolveLiveBackgroundMutationMock(...args),
}));

function createParam(value = 0) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function createInput(overrides: Record<string, unknown> = {}) {
  const filter = {
    type: "lowpass",
    frequency: createParam(1200),
    Q: createParam(1),
    connect: vi.fn(),
  };
  const dryGain = {
    gain: createParam(1),
    connect: vi.fn(),
  };
  const wetGain = {
    gain: createParam(0.0001),
    connect: vi.fn(),
  };
  const drive = {
    curve: null,
    oversample: "none",
    connect: vi.fn(),
  };
  const backgroundGain = {
    gain: createParam(0.8),
    connect: vi.fn(),
  };
  const deckGain = {
    gain: createParam(0.7),
  };
  const playbackRate = createParam(1);
  const source = {
    playbackRate,
  };
  const context = {
    currentTime: 12,
    destination: { id: "destination" },
    createBiquadFilter: vi.fn(() => filter),
    createGain: vi
      .fn()
      .mockImplementationOnce(() => dryGain)
      .mockImplementationOnce(() => wetGain)
      .mockImplementationOnce(() => backgroundGain),
    createWaveShaper: vi.fn(() => drive),
  };

  return {
    audioContextRef: { current: context },
    masterGainRef: { current: { id: "master" } },
    backgroundGainRef: { current: null },
    backgroundDryGainRef: { current: null },
    backgroundDriveWetGainRef: { current: null },
    backgroundDriveNodeRef: { current: null },
    filterNodeRef: { current: null },
    backgroundDeckRef: {
      current: {
        source,
        gain: deckGain,
      },
    },
    selectedStyleProfile: {
      backgroundGain: 0.8,
      filterBaseHz: 220,
      filterCeilingHz: 1200,
    },
    selectedMutationProfile: {
      backgroundDucking: 0.2,
      filterSweepMultiplier: 1.3,
      anomalyBoostMultiplier: 1.5,
      transitionTightness: 0.4,
    },
    forcedLiveMutationState: "auto",
    liveEnabled: true,
    setLiveMutationState: vi.fn(),
    __internals: {
      context,
      filter,
      dryGain,
      wetGain,
      drive,
      backgroundGain,
      deckGain,
      playbackRate,
    },
    ...overrides,
  } as never;
}

describe("useLiveLogMonitorBackgroundAudioEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDriveCurveMock.mockReturnValue("curve");
    forceBackgroundMutationProfileMock.mockReturnValue({ accent: "forced" });
    resolveLiveBackgroundMutationMock.mockReturnValue({
      mutation: { accent: "warn" },
      nextState: "warning",
    });
    buildBackgroundMutationAutomationPlanMock.mockReturnValue({
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
    });
  });

  it("builds the shared background bus only once and wires created nodes", () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorBackgroundAudioEngine(input));

    result.current.ensureBackgroundBus(input.audioContextRef.current);

    expect(input.audioContextRef.current.createBiquadFilter).toHaveBeenCalled();
    expect(input.audioContextRef.current.createGain).toHaveBeenCalledTimes(3);
    expect(input.audioContextRef.current.createWaveShaper).toHaveBeenCalled();
    expect(input.filterNodeRef.current).toBe(input.__internals.filter);
    expect(input.backgroundDryGainRef.current).toBe(input.__internals.dryGain);
    expect(input.backgroundDriveWetGainRef.current).toBe(input.__internals.wetGain);
    expect(input.backgroundDriveNodeRef.current).toBe(input.__internals.drive);
    expect(input.backgroundGainRef.current).toBe(input.__internals.backgroundGain);
    expect(createDriveCurveMock).toHaveBeenCalledWith(1.35);
    expect(input.__internals.filter.connect).toHaveBeenCalledWith(input.__internals.dryGain);
    expect(input.__internals.drive.connect).toHaveBeenCalledWith(input.__internals.wetGain);
    expect(input.__internals.backgroundGain.connect).toHaveBeenCalledWith(
      input.masterGainRef.current,
    );
  });

  it("applies live or forced mutation automation to the active deck", () => {
    const input = createInput({
      backgroundGainRef: { current: { gain: createParam(0.8) } },
      backgroundDryGainRef: { current: { gain: createParam(1) } },
      backgroundDriveWetGainRef: { current: { gain: createParam(0.0001) } },
      backgroundDriveNodeRef: { current: { curve: null } },
      filterNodeRef: { current: { frequency: createParam(1200), Q: createParam(1) } },
      forcedLiveMutationState: "critical",
    });

    const { result } = renderHook(() => useLiveLogMonitorBackgroundAudioEngine(input));

    expect(forceBackgroundMutationProfileMock).toHaveBeenCalledWith(
      "critical",
      input.selectedStyleProfile,
    );
    expect(buildBackgroundMutationAutomationPlanMock).toHaveBeenCalled();
    expect(input.setLiveMutationState).toHaveBeenCalledWith("critical");

    result.current.applyLogModulation({ levelCounts: { ERROR: 2 } } as never);

    expect(resolveLiveBackgroundMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        forcedLiveMutationState: "critical",
      }),
    );
    expect(input.setLiveMutationState).toHaveBeenCalledWith("warning");
    expect(input.filterNodeRef.current.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      800,
      12.06,
    );
    expect(
      input.backgroundDeckRef.current.source.playbackRate.linearRampToValueAtTime,
    ).toHaveBeenCalledWith(0.96, 12.05);
    expect(input.backgroundDeckRef.current.gain.gain.linearRampToValueAtTime).toHaveBeenCalled();
  });
});
