import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  buildDispatchReplayEventAtIndexStateInput,
  buildEmitMonitorProviderUpdateStateInput,
  buildResumeMonitorAudioContextStateInput,
  buildRunMonitorProviderPollStateInput,
  buildSyncGuideTrackCursorStateInput,
  buildSyncReplayTelemetryStateInput,
} from "../../../src/features/monitor/monitorProviderOrchestrationRuntime";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";

function createUpdate(): LiveLogStreamUpdate {
  return {
    summary: "window",
    dominantLevel: "info",
    confidence: 0.7,
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { info: 3 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    fromOffset: 0,
    toOffset: 128,
    suggestedBpm: 126,
  };
}

function createReplayEvent(): SessionEvent {
  return {
    id: 1,
    sessionId: "persisted-1",
    pollIndex: 1,
    capturedAt: "2026-06-29T00:00:00.000Z",
    fromOffset: 0,
    toOffset: 10,
    summary: "event-1",
    suggestedBpm: 126,
    confidence: 0.9,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCountsJson: "{}",
    anomalyMarkersJson: "[]",
    topComponentsJson: "[]",
    sonificationCuesJson: "[]",
    parsedLinesJson: "[]",
    warningsJson: "[]",
  };
}

describe("monitorProviderOrchestrationRuntime", () => {
  it("builds emit-update state with persistence adapters", () => {
    const updatePersistedSessionCursor = vi.fn(async () => undefined);
    const insertSessionEvent = vi.fn(async () => undefined);
    const listenersRef = { current: new Set() };
    const sessionRef = { current: { persistedSessionId: "persisted-1" } };
    const pollIndexRef = { current: 0 };
    const audioContextRef = { current: null };
    const setMetrics = vi.fn();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const state = buildEmitMonitorProviderUpdateStateInput({
      update: createUpdate(),
      listenersRef,
      sessionRef,
      pollIndexRef,
      audioContextRef,
      setMetrics,
      updatePersistedSessionCursor,
      insertSessionEvent,
      logger,
      options: { persistPlaybackEvent: false },
    });

    state.updatePersistedCursor({
      sessionId: "persisted-1",
      toOffset: 512,
      lineCount: 9,
      anomalyCount: 2,
      suggestedBpm: 128,
    });
    state.insertPersistedEvent({
      sessionId: "persisted-1",
      pollIndex: 1,
      fromOffset: 0,
      toOffset: 10,
      summary: "window",
      suggestedBpm: 126,
      confidence: 0.7,
      dominantLevel: "info",
      lineCount: 3,
      anomalyCount: 1,
      levelCountsJson: "{}",
      anomalyMarkersJson: "[]",
      topComponentsJson: "[]",
      sonificationCuesJson: "[]",
      parsedLinesJson: "[]",
      warningsJson: "[]",
    });

    expect(updatePersistedSessionCursor).toHaveBeenCalledWith("persisted-1", 512, 9, 2, 128);
    expect(insertSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "persisted-1", summary: "window" }),
    );
    expect(state.listenersRef).toBe(listenersRef);
    expect(state.logger).toBe(logger);
  });

  it("builds provider poll state from the shared refs and handlers", () => {
    const sessionRef = { current: null };
    const activeRef = { current: true };
    const directCursorRef = { current: 64 as number | undefined };
    const emptyWindowsRef = { current: 1 };
    const wsLineBufferRef = { current: ["line"] };
    const httpUrlRef = { current: "http://localhost:9999/logs" };
    const pollStreamSession = vi.fn();
    const pollLogStream = vi.fn();
    const ingestStreamChunk = vi.fn();
    const fetchText = vi.fn();
    const emitUpdate = vi.fn();
    const schedulePoll = vi.fn();
    const doPoll = vi.fn(async () => undefined);
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const state = buildRunMonitorProviderPollStateInput({
      sessionRef,
      activeRef,
      directCursorRef,
      emptyWindowsRef,
      wsLineBufferRef,
      httpUrlRef,
      pollStreamSession,
      pollLogStream,
      ingestStreamChunk,
      fetchText,
      emitUpdate,
      schedulePoll,
      doPoll,
      logger,
    });

    expect(state.sessionRef).toBe(sessionRef);
    expect(state.activeRef).toBe(activeRef);
    expect(state.httpUrlRef.current).toBe("http://localhost:9999/logs");
    expect(state.schedulePoll).toBe(schedulePoll);
    expect(state.doPoll).toBe(doPoll);
  });

  it("builds replay and telemetry sync state from monitor refs", () => {
    const replayEventsRef = { current: [createReplayEvent()] };
    const replayMetricsRef = { current: [] };
    const playbackCount = vi.fn();
    const playbackIndex = vi.fn();
    const playbackProgress = vi.fn();
    const setMetrics = vi.fn();
    const guideTrackCursorRef = { current: { current: 0 } };
    const guideTrackFinishedRef = { current: false };

    const telemetryState = buildSyncReplayTelemetryStateInput({
      processedEvents: 1,
      replayEventsRef,
      replayMetricsRef,
      setPlaybackEventCount: playbackCount,
      setPlaybackEventIndex: playbackIndex,
      setPlaybackProgress: playbackProgress,
      setMetrics,
    });
    const replayState = buildDispatchReplayEventAtIndexStateInput({
      eventIndex: 0,
      replayEventsRef,
      replayIndexRef: { current: 0 },
      sessionRef: { current: null },
      emitUpdate: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      syncGuideTrackToReplayProgress: vi.fn(),
      syncGuideTrack: true,
    });
    const guideTrackState = buildSyncGuideTrackCursorStateInput({
      pcm: null,
      cursorRef: guideTrackCursorRef,
      finishedRef: guideTrackFinishedRef,
      progress: 0.25,
    });

    expect(telemetryState.replayEventsRef).toBe(replayEventsRef);
    expect(replayState.replayEventsRef).toBe(replayEventsRef);
    expect(guideTrackState.cursorRef).toBe(guideTrackCursorRef);
    expect(guideTrackState.progress).toBe(0.25);
  });

  it("builds manual resume state with the expected probe and resume reason", () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const state = buildResumeMonitorAudioContextStateInput({
      audioContextRef: { current: null },
      setAudioContext: vi.fn(),
      logger,
    });

    const ensureState = state.ensureAudioContext();
    const probeState = state.emitProbe({ state: "running" } as AudioContext);

    expect(ensureState.reason).toBe("manual-resume");
    expect(ensureState.logger).toBe(logger);
    expect(probeState.frequency).toBe(440);
    expect(probeState.releaseTimeSec).toBe(0.3);
  });
});
