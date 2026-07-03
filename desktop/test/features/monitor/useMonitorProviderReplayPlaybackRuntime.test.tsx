import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMonitorProviderReplayPlaybackRuntime } from "../../../src/features/monitor/useMonitorProviderReplayPlaybackRuntime";

const { dispatchReplayEventAtIndexStateMock, runReplayTickStateMock, stopAllMonitorAudioMock } =
  vi.hoisted(() => ({
    dispatchReplayEventAtIndexStateMock: vi.fn(),
    runReplayTickStateMock: vi.fn(),
    stopAllMonitorAudioMock: vi.fn(),
  }));

vi.mock("../../../src/features/monitor/monitorPlaybackRuntime", () => ({
  dispatchReplayEventAtIndexState: (...args: unknown[]) =>
    dispatchReplayEventAtIndexStateMock(...args),
  runReplayTickState: (...args: unknown[]) => runReplayTickStateMock(...args),
}));

vi.mock("../../../src/features/monitor/monitorContextRuntime", () => ({
  stopAllMonitorAudio: () => stopAllMonitorAudioMock(),
}));

function createRuntimeInput() {
  return {
    input: {
      live: {
        activeRef: { current: true },
        pollTimerRef: { current: null },
      },
      playback: {
        replayEventsRef: { current: [] },
        replayIndexRef: { current: 0 },
        replayHydratingRef: { current: false },
        playbackPausedRef: { current: false },
        setIsPlaybackPaused: vi.fn(),
      },
      session: {
        sessionRef: { current: null },
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
    },
    emitUpdate: vi.fn(),
    syncReplayTelemetry: vi.fn(),
    syncGuideTrackToReplayProgress: vi.fn(),
  } as never;
}

describe("useMonitorProviderReplayPlaybackRuntime", () => {
  it("dispatches replay events through the playback state runtime", () => {
    dispatchReplayEventAtIndexStateMock.mockReturnValue(true);
    const runtimeInput = createRuntimeInput();

    const { result } = renderHook(() => useMonitorProviderReplayPlaybackRuntime(runtimeInput));

    expect(result.current.dispatchReplayEventAtIndex(3, { syncGuideTrack: true })).toBe(true);
    expect(dispatchReplayEventAtIndexStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventIndex: 3,
        syncGuideTrack: true,
      }),
    );
  });

  it("runs replay ticks through the playback runtime", () => {
    const runtimeInput = createRuntimeInput();

    const { result } = renderHook(() => useMonitorProviderReplayPlaybackRuntime(runtimeInput));

    result.current.replayTick();

    expect(runReplayTickStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRef: runtimeInput.input.live.activeRef,
      }),
    );
  });
});
