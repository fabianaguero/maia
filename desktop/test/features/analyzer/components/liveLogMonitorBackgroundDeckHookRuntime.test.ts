import { describe, expect, it, vi } from "vitest";

import {
  buildScheduleBackgroundTransitionControllerInput,
  buildStartBackgroundDeckControllerInput,
  clearBackgroundTransitionTimer,
  loadBackgroundDeckBuffer,
} from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckHookRuntime";

const { loadCachedBackgroundBufferMock, convertFileSrcMock } = vi.hoisted(() => ({
  loadCachedBackgroundBufferMock: vi.fn(),
  convertFileSrcMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (...args: unknown[]) => convertFileSrcMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime", () => ({
  loadCachedBackgroundBuffer: (...args: unknown[]) => loadCachedBackgroundBufferMock(...args),
}));

function createHookInput(overrides: Record<string, unknown> = {}) {
  return {
    audioContextRef: { current: { currentTime: 10 } },
    backgroundDeckRef: { current: { trackId: "track-1" } },
    backgroundTransitionTimerRef: { current: null },
    backgroundBufferCacheRef: { current: new Map() },
    filterNodeRef: { current: { id: "filter" } },
    playableBaseTracks: [{ id: "track-1" }, { id: "track-2" }],
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
    ...overrides,
  } as never;
}

describe("liveLogMonitorBackgroundDeckHookRuntime", () => {
  it("clears the active transition timer", () => {
    const clearTimeoutFn = vi.fn();
    const backgroundTransitionTimerRef = { current: 42 };

    clearBackgroundTransitionTimer({
      backgroundTransitionTimerRef: backgroundTransitionTimerRef as never,
      clearTimeoutFn,
    });

    expect(clearTimeoutFn).toHaveBeenCalledWith(42);
    expect(backgroundTransitionTimerRef.current).toBeNull();
  });

  it("delegates background buffer loading", async () => {
    const cache = new Map<string, Promise<AudioBuffer>>();
    const context = { currentTime: 10 } as AudioContext;
    const track = { id: "track-1" } as never;
    loadCachedBackgroundBufferMock.mockResolvedValue({ duration: 180 });

    const result = await loadBackgroundDeckBuffer({
      context,
      track,
      cache,
      isTauriRuntime: false,
    });

    expect(loadCachedBackgroundBufferMock).toHaveBeenCalledWith(
      expect.objectContaining({ context, track, cache, isTauriRuntime: false }),
    );
    expect(result).toEqual({ duration: 180 });
  });

  it("builds start and schedule controller inputs", async () => {
    const hookInput = createHookInput();
    const context = { currentTime: 10 } as AudioContext;
    const loadBackgroundBufferFn = vi.fn();
    const startInput = buildStartBackgroundDeckControllerInput({
      hookInput,
      context,
      trackIndex: 1,
      transitionPlan: { nextTrackId: "track-2" } as never,
      loadBackgroundBuffer: loadBackgroundBufferFn,
    });

    expect(startInput.trackIndex).toBe(1);
    expect(startInput.getFilter()).toEqual({ id: "filter" });
    expect(startInput.previousDeck).toEqual({ trackId: "track-1" });

    const startBackgroundDeck = vi.fn().mockResolvedValue(undefined);
    const scheduleInput = buildScheduleBackgroundTransitionControllerInput({
      hookInput,
      currentDeck: { trackId: "track-1" } as never,
      startBackgroundDeck,
      context,
    });

    scheduleInput.onStartTransition(1, { nextTrackId: "track-2" } as never);
    await Promise.resolve();
    expect(startBackgroundDeck).toHaveBeenCalledWith(context, 1, { nextTrackId: "track-2" });
  });
});
