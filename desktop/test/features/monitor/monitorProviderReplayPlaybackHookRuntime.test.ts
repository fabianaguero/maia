import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderDispatchReplayEventAtIndexHookInput,
  buildMonitorProviderReplayTickHookInput,
} from "../../../src/features/monitor/monitorProviderReplayPlaybackHookRuntime";

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

describe("monitorProviderReplayPlaybackHookRuntime", () => {
  it("builds dispatch replay event hook input", () => {
    const runtimeInput = createRuntimeInput();

    const built = buildMonitorProviderDispatchReplayEventAtIndexHookInput(runtimeInput, 7, true);

    expect(built.eventIndex).toBe(7);
    expect(built.replayEventsRef).toBe(runtimeInput.input.playback.replayEventsRef);
    expect(built.syncGuideTrack).toBe(true);
  });

  it("builds replay tick hook input", () => {
    const runtimeInput = createRuntimeInput();
    const replayTick = vi.fn();
    const dispatchReplayEventAtIndex = vi.fn();
    const stopAllMonitorAudio = vi.fn();

    const built = buildMonitorProviderReplayTickHookInput({
      runtimeInput,
      dispatchReplayEventAtIndex,
      replayTick,
      stopAllMonitorAudio,
    });

    expect(built.activeRef).toBe(runtimeInput.input.live.activeRef);
    expect(built.intervalMs).toBeGreaterThan(0);
    expect(built.dispatchReplayEventAtIndex).toBe(dispatchReplayEventAtIndex);
    expect(built.stopAllMonitorAudio).toBe(stopAllMonitorAudio);
    expect(built.replayTick).toBe(replayTick);
  });
});
