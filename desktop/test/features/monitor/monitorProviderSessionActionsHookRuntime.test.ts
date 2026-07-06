import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderSessionActionsResult,
  buildMonitorProviderSessionLiveCallbacksInput,
  buildMonitorProviderSessionPlaybackCallbacksInput,
  buildMonitorProviderSessionStopCallbackInput,
} from "../../../src/features/monitor/monitorProviderSessionActionsHookRuntime";

function createInput() {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    session: {
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setMetrics: vi.fn(),
      isPlayback: false,
    },
    live: {
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollTimerRef: { current: null as number | null },
    },
    audio: {
      currentSegmentRef: { current: null },
      audioContextRef: { current: null },
    },
    replay: {
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
    },
    guideTrack: {
      guideTrackPathRef: { current: null as string | null },
      guideTrackQueueRef: { current: [] as string[] },
      guideTrackRef: { current: null },
      guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    },
    runtime: {
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn(() => ({ marker: "live-start-input" }) as never),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
    },
    api: {
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
      pollLogStream: vi.fn(),
    },
  };
}

describe("monitorProviderSessionActionsHookRuntime", () => {
  it("builds live, playback and stop callback inputs from explicit session slices", () => {
    const input = createInput();

    expect(buildMonitorProviderSessionLiveCallbacksInput(input)).toEqual({
      api: input.api,
      logger: input.logger,
      runtime: input.runtime,
      session: input.session,
    });

    expect(buildMonitorProviderSessionPlaybackCallbacksInput(input)).toBe(input);

    expect(buildMonitorProviderSessionStopCallbackInput(input)).toEqual({
      api: input.api,
      audio: input.audio,
      live: input.live,
      logger: input.logger,
      runtime: input.runtime,
      session: input.session,
    });
  });

  it("returns a stable session action envelope", () => {
    const replaceExistingSessionIfPresent = vi.fn(async () => undefined);
    const startSession = vi.fn(async () => true);
    const attachSession = vi.fn(async () => true);
    const playbackSession = vi.fn(async () => true);
    const stopSession = vi.fn(async () => undefined);

    expect(
      buildMonitorProviderSessionActionsResult({
        live: {
          replaceExistingSessionIfPresent,
          startSession,
          attachSession,
        },
        playback: {
          playbackSession,
        },
        stop: {
          stopSession,
        },
      }),
    ).toEqual({
      replaceExistingSessionIfPresent,
      startSession,
      attachSession,
      playbackSession,
      stopSession,
    });
  });
});
