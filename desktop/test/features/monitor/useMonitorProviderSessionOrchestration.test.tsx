import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as MonitorProviderSessionOrchestrationRuntimeModule from "../../../src/features/monitor/monitorProviderSessionOrchestrationRuntime";
import type * as UseMonitorProviderRuntimeOrchestrationModule from "../../../src/features/monitor/useMonitorProviderRuntimeOrchestration";
import type * as UseMonitorProviderSessionActionsModule from "../../../src/features/monitor/useMonitorProviderSessionActions";

const mocks = vi.hoisted(() => ({
  buildMonitorProviderSessionOrchestrationDependencies: vi.fn(),
  useMonitorProviderRuntimeOrchestration: vi.fn(),
  useMonitorProviderSessionActions: vi.fn(),
}));

vi.mock("../../../src/features/monitor/monitorProviderSessionOrchestrationRuntime", async () => {
  const actual = await vi.importActual<typeof MonitorProviderSessionOrchestrationRuntimeModule>(
    "../../../src/features/monitor/monitorProviderSessionOrchestrationRuntime",
  );

  return {
    ...actual,
    buildMonitorProviderSessionOrchestrationDependencies: (...args: unknown[]) =>
      mocks.buildMonitorProviderSessionOrchestrationDependencies(...args),
  };
});

vi.mock("../../../src/features/monitor/useMonitorProviderRuntimeOrchestration", async () => {
  const actual = await vi.importActual<typeof UseMonitorProviderRuntimeOrchestrationModule>(
    "../../../src/features/monitor/useMonitorProviderRuntimeOrchestration",
  );

  return {
    ...actual,
    useMonitorProviderRuntimeOrchestration: (...args: unknown[]) =>
      mocks.useMonitorProviderRuntimeOrchestration(...args),
  };
});

vi.mock("../../../src/features/monitor/useMonitorProviderSessionActions", async () => {
  const actual = await vi.importActual<typeof UseMonitorProviderSessionActionsModule>(
    "../../../src/features/monitor/useMonitorProviderSessionActions",
  );

  return {
    ...actual,
    useMonitorProviderSessionActions: (...args: unknown[]) =>
      mocks.useMonitorProviderSessionActions(...args),
  };
});

import { useMonitorProviderSessionOrchestration } from "../../../src/features/monitor/useMonitorProviderSessionOrchestration";

describe("useMonitorProviderSessionOrchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildMonitorProviderSessionOrchestrationDependencies.mockReturnValue({
      runtimeOrchestrationInput: {
        logger: { info: vi.fn(), warn: vi.fn(), trace: vi.fn(), debug: vi.fn(), error: vi.fn() },
      },
      buildSessionActionsInput: vi.fn(() => ({
        logger: { info: vi.fn(), warn: vi.fn(), trace: vi.fn(), debug: vi.fn(), error: vi.fn() },
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
          directCursorRef: { current: undefined },
          emptyWindowsRef: { current: 0 },
          pollTimerRef: { current: null },
        },
        audio: { currentSegmentRef: { current: null }, audioContextRef: { current: null } },
        replay: {
          replayEventsRef: { current: [] },
          replayMetricsRef: { current: [] },
          replayIndexRef: { current: 0 },
          replayHydratingRef: { current: false },
          replayHydrationTokenRef: { current: 0 },
          playbackPausedRef: { current: false },
        },
        guideTrack: {
          guideTrackPathRef: { current: null },
          guideTrackQueueRef: { current: [] },
          guideTrackRef: { current: null },
          guideTrackLoadPromiseRef: { current: null },
        },
        runtime: {
          stopPolling: vi.fn(),
          buildLiveStartInput: vi.fn(),
          ensureProviderAudioContext: vi.fn(),
          replayTick: vi.fn(),
          syncReplayTelemetry: vi.fn(),
          resetReplayTelemetry: vi.fn(),
        },
        api: {
          startStreamSession: vi.fn(),
          stopStreamSession: vi.fn(),
          listSessionEvents: vi.fn(),
          updatePersistedSessionStatus: vi.fn(),
          pollLogStream: vi.fn(),
        },
      })),
    });
    mocks.useMonitorProviderRuntimeOrchestration.mockReturnValue({
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn(),
      ensureProviderAudioContext: vi.fn(),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
      resumeAudio: vi.fn(),
    });
    mocks.useMonitorProviderSessionActions.mockReturnValue({
      replaceExistingSessionIfPresent: vi.fn(),
      startSession: vi.fn(),
      attachSession: vi.fn(),
      playbackSession: vi.fn(),
      stopSession: vi.fn(),
    });
  });

  it("builds dependencies once and rewires runtime callbacks from the orchestration hook", () => {
    const input = {
      state: { marker: "state" },
      logger: { info: vi.fn(), warn: vi.fn(), trace: vi.fn(), debug: vi.fn(), error: vi.fn() },
      buildReloadPendingGuideTrack: vi.fn(() => vi.fn()),
      transport: {
        pollStreamSession: vi.fn(),
        pollLogStream: vi.fn(),
        ingestStreamChunk: vi.fn(),
        fetchText: vi.fn(async () => ""),
      },
      sessionApi: {
        startStreamSession: vi.fn(),
        stopStreamSession: vi.fn(),
        listSessionEvents: vi.fn(),
      },
      persistence: {
        updatePersistedSessionCursor: vi.fn(),
        insertSessionEvent: vi.fn(),
        updatePersistedSessionStatus: vi.fn(),
      },
    } as never;

    const { result } = renderHook(() => useMonitorProviderSessionOrchestration(input));

    expect(mocks.buildMonitorProviderSessionOrchestrationDependencies).toHaveBeenCalledWith(input);
    expect(mocks.useMonitorProviderRuntimeOrchestration).toHaveBeenCalledWith(
      mocks.buildMonitorProviderSessionOrchestrationDependencies.mock.results[0]?.value
        .runtimeOrchestrationInput,
    );
    expect(
      mocks.buildMonitorProviderSessionOrchestrationDependencies.mock.results[0]?.value
        .buildSessionActionsInput,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        stopPolling:
          mocks.useMonitorProviderRuntimeOrchestration.mock.results[0]?.value.stopPolling,
        buildLiveStartInput:
          mocks.useMonitorProviderRuntimeOrchestration.mock.results[0]?.value.buildLiveStartInput,
      }),
    );
    expect(mocks.useMonitorProviderSessionActions).toHaveBeenCalledWith(
      mocks.buildMonitorProviderSessionOrchestrationDependencies.mock.results[0]?.value
        .buildSessionActionsInput.mock.results[0]?.value,
    );
    expect(result.current).toEqual({
      orchestration: mocks.useMonitorProviderRuntimeOrchestration.mock.results[0]?.value,
      sessionActions: mocks.useMonitorProviderSessionActions.mock.results[0]?.value,
    });
  });
});
