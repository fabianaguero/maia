import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorBackgroundDeckControl } from "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundDeckControl";

const {
  loadCachedBackgroundBufferMock,
  resolveBackgroundDeckStartPlanMock,
  resolveBackgroundTransitionSchedulePlanMock,
  isTauriMock,
  convertFileSrcMock,
} = vi.hoisted(() => ({
  loadCachedBackgroundBufferMock: vi.fn(),
  resolveBackgroundDeckStartPlanMock: vi.fn(),
  resolveBackgroundTransitionSchedulePlanMock: vi.fn(),
  isTauriMock: vi.fn(),
  convertFileSrcMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (...args: unknown[]) => convertFileSrcMock(...args),
  isTauri: () => isTauriMock(),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime",
  () => ({
    loadCachedBackgroundBuffer: (...args: unknown[]) => loadCachedBackgroundBufferMock(...args),
  }),
);

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorBackgroundRuntime", () => ({
  resolveBackgroundDeckStartPlan: (...args: unknown[]) =>
    resolveBackgroundDeckStartPlanMock(...args),
  resolveBackgroundTransitionSchedulePlan: (...args: unknown[]) =>
    resolveBackgroundTransitionSchedulePlanMock(...args),
}));

function createParam(value = 0.7) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function createTrack(id: string) {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
  };
}

function createInput(overrides: Record<string, unknown> = {}) {
  const source = {
    buffer: null,
    loop: false,
    playbackRate: createParam(1),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gainNode = {
    gain: createParam(0.4),
    connect: vi.fn(),
  };
  const context = {
    currentTime: 10,
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gainNode),
  };

  return {
    audioContextRef: { current: context },
    backgroundDeckRef: { current: null },
    backgroundTransitionTimerRef: { current: null },
    backgroundBufferCacheRef: { current: new Map() },
    filterNodeRef: { current: { id: "filter" } },
    playableBaseTracks: [createTrack("track-1"), createTrack("track-2")],
    selectedStyleProfile: {
      backgroundGain: 0.8,
      playlistCrossfadeSeconds: 6,
      transitionFeel: "smooth",
    },
    selectedMutationProfile: {
      transitionTightness: 0.5,
    },
    maxRecentWarnings: 4,
    ensureBackgroundBus: vi.fn(),
    setBackgroundNowPlayingId: vi.fn(),
    setBackgroundTransitionPlan: vi.fn(),
    setBackgroundPlayheadSecond: vi.fn(),
    setRecentWarnings: vi.fn(),
    toMessage: vi.fn(() => "boom"),
    __internals: {
      context,
      source,
      gainNode,
    },
    ...overrides,
  } as never;
}

describe("useLiveLogMonitorBackgroundDeckControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTauriMock.mockReturnValue(false);
    resolveBackgroundDeckStartPlanMock.mockReturnValue({
      fadeSeconds: 0.9,
      entrySecond: 8,
      playbackRate: 1,
      looping: false,
    });
    resolveBackgroundTransitionSchedulePlanMock.mockReturnValue({
      action: "schedule",
      trackIndex: 1,
      transitionPlan: { nextTrackId: "track-2" },
      delayMs: 25,
    });
    loadCachedBackgroundBufferMock.mockResolvedValue({ duration: 180 });
  });

  it("stops the active deck and clears transition state", () => {
    const input = createInput({
      backgroundDeckRef: {
        current: {
          source: { stop: vi.fn() },
          gain: { gain: createParam(0.5) },
        },
      },
      backgroundTransitionTimerRef: { current: 42 },
    });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { result } = renderHook(() => useLiveLogMonitorBackgroundDeckControl(input));

    result.current.stopBackgroundDeck(0.2);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(42);
    expect(input.backgroundDeckRef.current).toBeNull();
    expect(input.setBackgroundNowPlayingId).toHaveBeenCalledWith(null);
    expect(input.setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
  });

  it("starts the background deck and stores now playing state", async () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorBackgroundDeckControl(input));

    await result.current.startBackgroundDeck(input.audioContextRef.current, 0);

    expect(input.ensureBackgroundBus).toHaveBeenCalledWith(input.audioContextRef.current);
    expect(loadCachedBackgroundBufferMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: input.audioContextRef.current,
        track: input.playableBaseTracks[0],
      }),
    );
    expect(resolveBackgroundDeckStartPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        track: input.playableBaseTracks[0],
      }),
    );
    expect(input.__internals.source.start).toHaveBeenCalledWith(10.02, 8);
    expect(input.setBackgroundNowPlayingId).toHaveBeenCalledWith("track-1");
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(8);
    expect(input.backgroundDeckRef.current).toMatchObject({
      trackId: "track-1",
      trackIndex: 0,
    });
  });

  it("schedules the next transition and lazily starts audio when needed", async () => {
    vi.useFakeTimers();
    const input = createInput({
      backgroundDeckRef: {
        current: {
          trackId: "track-1",
          trackIndex: 0,
          entrySecond: 8,
          playbackRate: 1,
          durationSec: 172,
        },
      },
    });
    const { result } = renderHook(() => useLiveLogMonitorBackgroundDeckControl(input));

    result.current.scheduleBackgroundTransition(
      input.audioContextRef.current,
      input.backgroundDeckRef.current,
    );

    expect(input.setBackgroundTransitionPlan).toHaveBeenCalledWith({ nextTrackId: "track-2" });

    vi.advanceTimersByTime(25);

    expect(loadCachedBackgroundBufferMock).toHaveBeenCalled();

    input.backgroundDeckRef.current = null;
    await result.current.ensureBackgroundAudio(input.audioContextRef.current);

    expect(loadCachedBackgroundBufferMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
