import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  scheduleBackgroundDeckTransitionController,
  startBackgroundDeckController,
} from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckControllerRuntime";

const {
  resolveBackgroundDeckStartPlanMock,
  resolveBackgroundTransitionSchedulePlanMock,
  startBackgroundDeckPlaybackMock,
  applyBackgroundTransitionScheduleMock,
} = vi.hoisted(() => ({
  resolveBackgroundDeckStartPlanMock: vi.fn(),
  resolveBackgroundTransitionSchedulePlanMock: vi.fn(),
  startBackgroundDeckPlaybackMock: vi.fn(),
  applyBackgroundTransitionScheduleMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorBackgroundRuntime", () => ({
  resolveBackgroundDeckStartPlan: (...args: unknown[]) =>
    resolveBackgroundDeckStartPlanMock(...args),
  resolveBackgroundTransitionSchedulePlan: (...args: unknown[]) =>
    resolveBackgroundTransitionSchedulePlanMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckStartRuntime",
  () => ({
    startBackgroundDeckPlayback: (...args: unknown[]) => startBackgroundDeckPlaybackMock(...args),
  }),
);

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorBackgroundTransitionTimerRuntime",
  () => ({
    applyBackgroundTransitionSchedule: (...args: unknown[]) =>
      applyBackgroundTransitionScheduleMock(...args),
  }),
);

describe("liveLogMonitorBackgroundDeckControllerRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBackgroundDeckStartPlanMock.mockReturnValue({
      fadeSeconds: 0.9,
      entrySecond: 8,
      playbackRate: 1,
      looping: false,
    });
    startBackgroundDeckPlaybackMock.mockReturnValue({
      nextDeck: { trackId: "track-1" },
      nowPlayingId: "track-1",
      activeTransitionPlan: null,
      playheadSecond: 8,
    });
    resolveBackgroundTransitionSchedulePlanMock.mockReturnValue({
      action: "schedule",
      trackIndex: 1,
      transitionPlan: { nextTrackId: "track-2" },
      delayMs: 25,
    });
    applyBackgroundTransitionScheduleMock.mockReturnValue(25);
  });

  it("starts a playable deck and returns the started payload", async () => {
    const result = await startBackgroundDeckController({
      context: { id: "ctx" } as never,
      trackIndex: 0,
      transitionPlan: null,
      playableBaseTracks: [{ id: "track-1" }] as never,
      styleProfile: {
        backgroundGain: 0.8,
        playlistCrossfadeSeconds: 6,
        transitionFeel: "smooth",
      },
      ensureBackgroundBus: vi.fn(),
      getFilter: () => ({ id: "filter" }) as never,
      loadBackgroundBuffer: vi.fn(async () => ({ duration: 180 }) as never),
      previousDeck: null,
      toMessage: vi.fn(() => "boom"),
    });

    expect(resolveBackgroundDeckStartPlanMock).toHaveBeenCalled();
    expect(startBackgroundDeckPlaybackMock).toHaveBeenCalled();
    expect(result).toMatchObject({
      action: "started",
      nowPlayingId: "track-1",
      playheadSecond: 8,
    });
  });

  it("returns noop/failure branches for missing tracks, filters, buffers and thrown errors", async () => {
    await expect(
      startBackgroundDeckController({
        context: {} as never,
        trackIndex: 9,
        playableBaseTracks: [],
        styleProfile: {
          backgroundGain: 0.8,
          playlistCrossfadeSeconds: 6,
          transitionFeel: "smooth",
        },
        ensureBackgroundBus: vi.fn(),
        getFilter: vi.fn(),
        loadBackgroundBuffer: vi.fn(),
        previousDeck: null,
        toMessage: vi.fn(() => "boom"),
      }),
    ).resolves.toEqual({ action: "noop" });

    await expect(
      startBackgroundDeckController({
        context: {} as never,
        trackIndex: 0,
        playableBaseTracks: [{ id: "track-1" }] as never,
        styleProfile: {
          backgroundGain: 0.8,
          playlistCrossfadeSeconds: 6,
          transitionFeel: "smooth",
        },
        ensureBackgroundBus: vi.fn(),
        getFilter: () => null,
        loadBackgroundBuffer: vi.fn(),
        previousDeck: null,
        toMessage: vi.fn(() => "boom"),
      }),
    ).resolves.toEqual({ action: "noop" });

    await expect(
      startBackgroundDeckController({
        context: {} as never,
        trackIndex: 0,
        playableBaseTracks: [{ id: "track-1" }] as never,
        styleProfile: {
          backgroundGain: 0.8,
          playlistCrossfadeSeconds: 6,
          transitionFeel: "smooth",
        },
        ensureBackgroundBus: vi.fn(),
        getFilter: () => ({ id: "filter" }) as never,
        loadBackgroundBuffer: vi.fn(async () => null),
        previousDeck: null,
        toMessage: vi.fn(() => "boom"),
      }),
    ).resolves.toEqual({ action: "noop" });

    await expect(
      startBackgroundDeckController({
        context: {} as never,
        trackIndex: 0,
        playableBaseTracks: [{ id: "track-1" }] as never,
        styleProfile: {
          backgroundGain: 0.8,
          playlistCrossfadeSeconds: 6,
          transitionFeel: "smooth",
        },
        ensureBackgroundBus: vi.fn(),
        getFilter: () => ({ id: "filter" }) as never,
        loadBackgroundBuffer: vi.fn(async () => {
          throw new Error("decode failed");
        }),
        previousDeck: null,
        toMessage: vi.fn(() => "boom"),
      }),
    ).resolves.toEqual({
      action: "failed",
      warningMessage: "Failed to start guide track: boom",
    });
  });

  it("delegates schedule planning and timer wiring", () => {
    const timer = scheduleBackgroundDeckTransitionController({
      playableBaseTracks: [{ id: "track-1" }, { id: "track-2" }] as never,
      currentDeck: { trackIndex: 0 } as never,
      styleProfile: {
        playlistCrossfadeSeconds: 6,
        transitionFeel: "smooth",
      },
      mutationProfile: {
        transitionTightness: 0.5,
      },
      setBackgroundTransitionPlan: vi.fn(),
      scheduleTimeout: vi.fn(() => 25),
      onStartTransition: vi.fn(),
    });

    expect(resolveBackgroundTransitionSchedulePlanMock).toHaveBeenCalled();
    expect(applyBackgroundTransitionScheduleMock).toHaveBeenCalled();
    expect(timer).toBe(25);
  });
});
