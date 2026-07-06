import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderRuntimeOrchestrationExternalDependencies,
  buildMonitorProviderRuntimeOrchestrationStateDependencies,
} from "../../../src/features/monitor/monitorProviderControllerInputSliceRuntime";
import { buildMonitorProviderRuntimeOrchestrationDependenciesFromState } from "../../../src/features/monitor/monitorProviderControllerInputRuntime";

function createState() {
  return {
    session: null,
    metrics: { processedLines: 0, totalAnomalies: 0, windowCount: 0 },
    isPlayback: false,
    guideTrackReady: false,
    guideTrackPath: null,
    playbackProgress: null,
    isPlaybackPaused: false,
    playbackEventIndex: null,
    playbackEventCount: null,
    guideTrackDurationSec: null,
    audioContext: null,
    activeTemplate: { id: "default" } as never,
    setGuideTrackReady: vi.fn(),
    setGuideTrackPathState: vi.fn(),
    setGuideTrackDurationSec: vi.fn(),
    setActiveTemplateState: vi.fn(),
    setIsPlaybackPaused: vi.fn(),
    audioContextRef: { current: null },
    listenersRef: { current: new Set() },
    currentSegmentRef: { current: null },
    guideTrackPathRef: { current: null as string | null },
    guideTrackQueueRef: { current: [] as string[] },
    guideTrackQueueIndexRef: { current: 0 },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    activeTemplateRef: { current: { id: "default" } as never },
    replayEventsRef: { current: [] },
    replayIndexRef: { current: 0 },
    pollTimerRef: { current: null as number | null },
    playbackPausedRef: { current: false },
    activeRef: { current: true },
    sessionRef: { current: null },
    setSession: vi.fn(),
    setIsPlayback: vi.fn(),
    setMetrics: vi.fn(),
    setAudioContext: vi.fn(),
    replayMetricsRef: { current: [] },
    replayHydratingRef: { current: false },
    replayHydrationTokenRef: { current: 0 },
    setPlaybackProgress: vi.fn(),
    setPlaybackEventIndex: vi.fn(),
    setPlaybackEventCount: vi.fn(),
    wsRef: { current: null as WebSocket | null },
    wsLineBufferRef: { current: [] as string[] },
    httpUrlRef: { current: "" },
    directCursorRef: { current: undefined as number | undefined },
    emptyWindowsRef: { current: 0 },
    pollIndexRef: { current: 0 },
    isPlaybackRef: { current: false },
  };
}

describe("monitorProviderControllerInputRuntime", () => {
  it("splits state and external orchestration dependency builders by concern", () => {
    const state = createState();
    const input = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
      state,
      buildReloadPendingGuideTrack: vi.fn((reason: string) => vi.fn(() => reason)),
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
      updatePersistedSessionCursor: vi.fn(async () => undefined),
      insertSessionEvent: vi.fn(async () => undefined),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
    };

    const stateDependencies = buildMonitorProviderRuntimeOrchestrationStateDependencies(state);
    expect(stateDependencies).toEqual(
      expect.objectContaining({
        sessionRef: state.sessionRef,
        setSession: state.setSession,
        audioContextRef: state.audioContextRef,
        replayEventsRef: state.replayEventsRef,
        listenersRef: state.listenersRef,
        activeTemplateRef: state.activeTemplateRef,
      }),
    );

    const externalDependencies =
      buildMonitorProviderRuntimeOrchestrationExternalDependencies(input);
    expect(externalDependencies).toEqual(
      expect.objectContaining({
        logger: input.logger,
        buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
        pollStreamSession: input.pollStreamSession,
        fetchText: input.fetchText,
        insertSessionEvent: input.insertSessionEvent,
      }),
    );

    const combined = buildMonitorProviderRuntimeOrchestrationDependenciesFromState(input);
    expect(combined).toEqual(
      expect.objectContaining({
        sessionRef: state.sessionRef,
        setSession: state.setSession,
        activeTemplateRef: state.activeTemplateRef,
        logger: input.logger,
        pollStreamSession: input.pollStreamSession,
        updatePersistedSessionStatus: input.updatePersistedSessionStatus,
      }),
    );
  });
});
