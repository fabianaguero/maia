import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorProviderPlaybackControls } from "../../../src/features/monitor/useMonitorProviderPlaybackControls";

const pauseMonitorPlaybackState = vi.fn();
const resumeMonitorPlaybackState = vi.fn();
const seekMonitorPlaybackProgressState = vi.fn();
const seekMonitorPlaybackWindowState = vi.fn();
const stepMonitorPlaybackWindowState = vi.fn();

vi.mock("../../../src/features/monitor/monitorProviderPlaybackControlsRuntime", () => ({
  pauseMonitorPlaybackState: (...args: unknown[]) => pauseMonitorPlaybackState(...args),
  resumeMonitorPlaybackState: (...args: unknown[]) => resumeMonitorPlaybackState(...args),
  seekMonitorPlaybackProgressState: (...args: unknown[]) =>
    seekMonitorPlaybackProgressState(...args),
  seekMonitorPlaybackWindowState: (...args: unknown[]) => seekMonitorPlaybackWindowState(...args),
  stepMonitorPlaybackWindowState: (...args: unknown[]) => stepMonitorPlaybackWindowState(...args),
}));

function createInput() {
  return {
    isPlayback: true,
    replayEventsRef: { current: [] },
    replayIndexRef: { current: 0 },
    pollTimerRef: { current: null as number | null },
    playbackPausedRef: { current: false },
    activeRef: { current: true },
    guideTrackFinishedRef: { current: false },
    dispatchReplayEventAtIndex: vi.fn(() => true),
    replayTick: vi.fn(),
    setIsPlaybackPaused: vi.fn(),
    intervalMs: 600,
  };
}

describe("useMonitorProviderPlaybackControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates progress seek and reuses the generated seek callback for window seeks", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderPlaybackControls(input));

    act(() => {
      result.current.seekPlaybackProgress(0.35);
      result.current.seekPlaybackWindow(9);
    });

    expect(seekMonitorPlaybackProgressState).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 0.35,
        replayTick: input.replayTick,
        dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
      }),
    );
    expect(seekMonitorPlaybackWindowState).toHaveBeenCalledWith(
      expect.objectContaining({
        replayWindowIndex: 9,
        replayEventsRef: input.replayEventsRef,
        seekPlaybackProgress: expect.any(Function),
      }),
    );
  });

  it("delegates pause/resume/step actions with the shared playback refs", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderPlaybackControls(input));

    act(() => {
      result.current.pausePlayback();
      result.current.resumePlayback();
      result.current.stepPlaybackWindow(-1);
    });

    expect(pauseMonitorPlaybackState).toHaveBeenCalledWith(
      expect.objectContaining({
        isPlayback: true,
        pollTimerRef: input.pollTimerRef,
        setIsPlaybackPaused: input.setIsPlaybackPaused,
      }),
    );
    expect(resumeMonitorPlaybackState).toHaveBeenCalledWith(
      expect.objectContaining({
        replayTick: input.replayTick,
        replayIndexRef: input.replayIndexRef,
        dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
      }),
    );
    expect(stepMonitorPlaybackWindowState).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: -1,
        activeRef: input.activeRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
      }),
    );
  });
});
