import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorBackgroundLifecycle } from "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundLifecycle";

const {
  resolveBackgroundDeckLifecyclePlanMock,
  snapshotBackgroundDeckStateMock,
} = vi.hoisted(() => ({
  resolveBackgroundDeckLifecyclePlanMock: vi.fn(),
  snapshotBackgroundDeckStateMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorBackgroundRuntime", () => ({
  resolveBackgroundDeckLifecyclePlan: (...args: unknown[]) =>
    resolveBackgroundDeckLifecyclePlanMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime",
  () => ({
    snapshotBackgroundDeckState: (...args: unknown[]) => snapshotBackgroundDeckStateMock(...args),
  }),
);

function createInput(overrides: Partial<Parameters<typeof useLiveLogMonitorBackgroundLifecycle>[0]> = {}) {
  return {
    liveEnabled: true,
    playableBaseTracks: [{ id: "track-1" }],
    playableBaseTrackIdsKey: "track-1",
    audioContextRef: {
      current: {
        state: "running",
        suspend: vi.fn(),
        resume: vi.fn(),
      } as unknown as AudioContext,
    },
    backgroundDeckRef: { current: { trackId: "track-1", trackIndex: 0 } },
    setBackgroundNowPlayingId: vi.fn(),
    setBackgroundTransitionPlan: vi.fn(),
    stopBackgroundDeck: vi.fn(),
    startBackgroundDeck: vi.fn(),
    scheduleBackgroundTransition: vi.fn(),
    ...overrides,
  };
}

describe("useLiveLogMonitorBackgroundLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotBackgroundDeckStateMock.mockReturnValue({ trackId: "track-1", trackIndex: 0 });
  });

  it("suspends the background deck and audio context when the lifecycle plan says suspend", () => {
    resolveBackgroundDeckLifecyclePlanMock.mockReturnValue({ action: "suspend" });
    const input = createInput();

    renderHook(() => useLiveLogMonitorBackgroundLifecycle(input));

    expect(input.stopBackgroundDeck).toHaveBeenCalledWith(0.12);
    expect(input.audioContextRef.current?.suspend).toHaveBeenCalled();
    expect(input.startBackgroundDeck).not.toHaveBeenCalled();
  });

  it("resumes the context and starts or restarts the deck when required", () => {
    resolveBackgroundDeckLifecyclePlanMock
      .mockReturnValueOnce({ action: "start", trackIndex: 2 })
      .mockReturnValueOnce({ action: "restart", trackIndex: 1, fadeOutSeconds: 0.3 });

    const input = createInput({
      audioContextRef: {
        current: {
          state: "suspended",
          suspend: vi.fn(),
          resume: vi.fn(),
        } as unknown as AudioContext,
      },
    });

    const { rerender } = renderHook(
      ({ value }) => useLiveLogMonitorBackgroundLifecycle(value),
      { initialProps: { value: input } },
    );

    expect(input.audioContextRef.current?.resume).toHaveBeenCalled();
    expect(input.startBackgroundDeck).toHaveBeenCalledWith(input.audioContextRef.current, 2);

    const nextInput = {
      ...input,
      playableBaseTrackIdsKey: "track-1,track-2",
    };

    rerender({ value: nextInput });

    expect(input.stopBackgroundDeck).toHaveBeenCalledWith(0.3);
    expect(input.startBackgroundDeck).toHaveBeenCalledWith(input.audioContextRef.current, 1);
  });

  it("syncs the current deck and schedules the next transition for sync plans", () => {
    resolveBackgroundDeckLifecyclePlanMock.mockReturnValue({
      action: "sync",
      trackId: "track-2",
      trackIndex: 3,
    });
    const input = createInput({
      playableBaseTracks: [{ id: "track-1" }, { id: "track-2" }],
      playableBaseTrackIdsKey: "track-1,track-2",
      backgroundDeckRef: {
        current: {
          trackId: "track-1",
          trackIndex: 0,
          looping: false,
        },
      },
    });

    renderHook(() => useLiveLogMonitorBackgroundLifecycle(input));

    expect(input.backgroundDeckRef.current).toMatchObject({
      trackId: "track-1",
      trackIndex: 3,
    });
    expect(input.setBackgroundNowPlayingId).toHaveBeenCalledWith("track-2");
    expect(input.setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
    expect(input.scheduleBackgroundTransition).toHaveBeenCalledWith(
      input.audioContextRef.current,
      expect.objectContaining({ trackIndex: 3 }),
    );
  });
});
