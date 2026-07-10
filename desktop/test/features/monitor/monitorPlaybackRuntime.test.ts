import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  activatePreparedPlaybackMonitorSessionState,
  clearReplayTimer,
  createPlaybackMonitorSession,
  dispatchReplayEventAtIndexState,
  finalizePlaybackMonitorSessionSetupState,
  hydrateReplayFromSourceState,
  maybeHydratePlaybackReplayState,
  pauseReplayPlaybackState,
  preparePlaybackMonitorSessionState,
  resumeReplayPlaybackState,
  runReplayTickState,
  seekReplayPlaybackState,
  seekReplayWindowState,
  stepReplayPlaybackWindowState,
} from "../../../src/features/monitor/monitorPlaybackRuntime";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";

function createEvent(index: number): SessionEvent {
  return {
    id: index + 1,
    sessionId: "persisted-1",
    pollIndex: index,
    capturedAt: "2026-06-26T00:00:00.000Z",
    fromOffset: index * 100,
    toOffset: index * 100 + 100,
    summary: `window-${index}`,
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: "warn",
    lineCount: 4,
    anomalyCount: index % 2,
    levelCountsJson: JSON.stringify({ warn: 1 }),
    anomalyMarkersJson: JSON.stringify([]),
    topComponentsJson: JSON.stringify([]),
    sonificationCuesJson: JSON.stringify([]),
    parsedLinesJson: JSON.stringify([`line-${index}`]),
    warningsJson: JSON.stringify([]),
  };
}

function createSession(): ActiveMonitorSession {
  return {
    sessionId: "playback_persisted-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "Replay",
    sourcePath: "/logs/replay.log",
    adapterKind: "file",
    pollMode: "direct",
    startedAt: 123,
  };
}

describe("monitorPlaybackRuntime", () => {
  it("clears replay timers", () => {
    const clearTimeoutFn = vi.fn();
    const pollTimerRef = { current: 45 as number | null };

    clearReplayTimer({ pollTimerRef, clearTimeoutFn });

    expect(clearTimeoutFn).toHaveBeenCalledWith(45);
    expect(pollTimerRef.current).toBeNull();
  });

  it("dispatches replay events and syncs telemetry/guide track", () => {
    const replayEventsRef = { current: [createEvent(0), createEvent(1)] };
    const replayIndexRef = { current: 0 };
    const sessionRef = { current: createSession() as ActiveMonitorSession | null };
    const emitUpdate = vi.fn<
      [LiveLogStreamUpdate, { accumulateMetrics?: boolean; persistPlaybackEvent?: boolean }?],
      void
    >();
    const syncReplayTelemetry = vi.fn();
    const syncGuideTrackToReplayProgress = vi.fn();

    const ok = dispatchReplayEventAtIndexState({
      eventIndex: 1,
      replayEventsRef,
      replayIndexRef,
      sessionRef,
      emitUpdate,
      syncReplayTelemetry,
      syncGuideTrackToReplayProgress,
      syncGuideTrack: true,
    });

    expect(ok).toBe(true);
    expect(replayIndexRef.current).toBe(2);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(2);
    expect(syncGuideTrackToReplayProgress).toHaveBeenCalledWith(0.5);
    expect(emitUpdate).toHaveBeenCalledTimes(1);
    expect(emitUpdate.mock.calls[0]?.[1]).toEqual({
      accumulateMetrics: false,
      persistPlaybackEvent: false,
    });
  });

  it("creates playback monitor sessions", () => {
    const session = createPlaybackMonitorSession({
      sessionId: "persisted-1",
      label: "Night watch",
      sourcePath: "/logs/replay.log",
      repoId: "repo-1",
      trackId: "track-1",
      trackTitle: "Replay Track",
      startedAt: 42,
    });

    expect(session).toEqual({
      sessionId: "playback_persisted-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "Night watch",
      trackId: "track-1",
      trackName: "Replay Track",
      sourcePath: "/logs/replay.log",
      adapterKind: "file",
      pollMode: "direct",
      startedAt: 42,
    });
  });

  it("prepares and activates playback sessions", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const prepared = await preparePlaybackMonitorSessionState({
      sessionId: "persisted-1",
      label: "Night watch",
      sourcePath: "/logs/replay.log",
      repoId: "repo-1",
      loadSessionEvents: vi.fn(async () => [createEvent(0), createEvent(1)]),
      logger,
    });

    expect(prepared?.events).toHaveLength(2);
    expect(prepared?.shouldHydrateReplay).toBe(true);
    expect(prepared?.session.repoTitle).toBe("Night watch");

    const sessionRef = { current: null as ActiveMonitorSession | null };
    const activeRef = { current: false };
    const isPlaybackRef = { current: false };
    const playbackPausedRef = { current: true };
    const replayEventsRef = { current: [] as SessionEvent[] };
    const replayMetricsRef = {
      current: [{ windowCount: 0, processedLines: 0, totalAnomalies: 0 }],
    };
    const replayIndexRef = { current: 4 };
    const replayHydratingRef = { current: false };
    const replayHydrationTokenRef = { current: 0 };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const setMetrics = vi.fn();
    const syncReplayTelemetry = vi.fn();

    const hydrationToken = activatePreparedPlaybackMonitorSessionState({
      prepared: prepared!,
      sessionRef,
      activeRef,
      isPlaybackRef,
      playbackPausedRef,
      replayEventsRef,
      replayMetricsRef,
      replayIndexRef,
      replayHydratingRef,
      replayHydrationTokenRef,
      setSession,
      setIsPlayback,
      setIsPlaybackPaused,
      setMetrics,
      syncReplayTelemetry,
    });

    expect(hydrationToken).toBe(1);
    expect(sessionRef.current?.sessionId).toBe("playback_persisted-1");
    expect(replayEventsRef.current).toHaveLength(2);
    expect(activeRef.current).toBe(true);
    expect(isPlaybackRef.current).toBe(true);
    expect(replayHydratingRef.current).toBe(true);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(0);
  });

  it("aborts preparation when no replay events can be restored", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const prepared = await preparePlaybackMonitorSessionState({
      sessionId: "persisted-1",
      label: "Night watch",
      sourcePath: "",
      repoId: null,
      loadSessionEvents: vi.fn(async () => []),
      logger,
    });

    expect(prepared).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("runs replay tick and schedules next iteration", () => {
    const setTimeoutFn = vi.fn(() => 88);
    const dispatchReplayEventAtIndex = vi.fn(() => true);
    const syncReplayTelemetry = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const stopAllMonitorAudio = vi.fn();
    const logger = { info: vi.fn() };
    const replayTick = vi.fn();
    const pollTimerRef = { current: null as number | null };

    runReplayTickState({
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      replayEventsRef: { current: [createEvent(0), createEvent(1)] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      pollTimerRef,
      setTimeoutFn,
      intervalMs: 600,
      dispatchReplayEventAtIndex,
      syncReplayTelemetry,
      setIsPlaybackPaused,
      stopAllMonitorAudio,
      logger,
      replayTick,
    });

    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(0);
    expect(setTimeoutFn).toHaveBeenCalledWith(replayTick, 600);
    expect(pollTimerRef.current).toBe(88);
    expect(stopAllMonitorAudio).not.toHaveBeenCalled();
  });

  it("seeks, pauses, resumes and steps playback state", () => {
    const replayEventsRef = { current: [createEvent(0), createEvent(1), createEvent(2)] };
    const replayIndexRef = { current: 3 };
    const pollTimerRef = { current: 77 as number | null };
    const playbackPausedRef = { current: false };
    const activeRef = { current: false };
    const guideTrackFinishedRef = { current: true };
    const clearTimeoutFn = vi.fn();
    const setTimeoutFn = vi.fn(() => 99);
    const replayTick = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const dispatchReplayEventAtIndex = vi.fn(() => true);

    seekReplayPlaybackState({
      progress: 0.4,
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      clearTimeoutFn,
      setTimeoutFn,
      intervalMs: 600,
      replayTick,
    });
    expect(dispatchReplayEventAtIndex).toHaveBeenCalled();
    expect(activeRef.current).toBe(true);
    expect(guideTrackFinishedRef.current).toBe(false);

    pauseReplayPlaybackState({
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      setIsPlaybackPaused,
      clearTimeoutFn,
    });
    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);

    resumeReplayPlaybackState({
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      setIsPlaybackPaused,
      clearTimeoutFn,
      setTimeoutFn,
      intervalMs: 600,
      replayTick,
    });
    expect(playbackPausedRef.current).toBe(false);
    expect(activeRef.current).toBe(true);

    stepReplayPlaybackWindowState({
      direction: -1,
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      setIsPlaybackPaused,
      clearTimeoutFn,
    });
    expect(playbackPausedRef.current).toBe(true);
    expect(activeRef.current).toBe(false);
  });

  it("seeks playback windows through progress indirection", () => {
    const seekPlaybackProgress = vi.fn();
    seekReplayWindowState({
      replayWindowIndex: 2,
      replayEventsRef: { current: [createEvent(0), createEvent(1), createEvent(2)] },
      seekPlaybackProgress,
    });

    expect(seekPlaybackProgress).toHaveBeenCalledWith(0.5);
  });

  it("hydrates replay events from source and reschedules the tick", async () => {
    const replayHydrationTokenRef = { current: 3 };
    const replayEventsRef = { current: [createEvent(0)] };
    const replayMetricsRef = {
      current: [{ windowCount: 0, processedLines: 0, totalAnomalies: 0 }],
    };
    const replayIndexRef = { current: 1 };
    const replayHydratingRef = { current: true };
    const activeRef = { current: true };
    const playbackPausedRef = { current: false };
    const pollTimerRef = { current: null as number | null };
    const syncReplayTelemetry = vi.fn();
    const setTimeoutFn = vi.fn(() => 111);
    const replayTick = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };

    await hydrateReplayFromSourceState({
      sessionId: "persisted-1",
      sourcePath: "/logs/replay.log",
      hydrationToken: 3,
      replayHydrationTokenRef,
      sessionRef: { current: createSession() as ActiveMonitorSession | null },
      replayEventsRef,
      replayMetricsRef,
      replayIndexRef,
      replayHydratingRef,
      activeRef,
      playbackPausedRef,
      pollTimerRef,
      syncReplayTelemetry,
      rebuildReplayEventsFromSource: vi.fn(async () => [createEvent(0), createEvent(1)]),
      setTimeoutFn,
      replayTick,
      logger,
    });

    expect(replayEventsRef.current).toHaveLength(2);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(1);
    expect(replayHydratingRef.current).toBe(false);
    expect(setTimeoutFn).toHaveBeenCalledWith(replayTick, 0);
    expect(pollTimerRef.current).toBe(111);
  });

  it("finalizes playback setup and optionally waits for the guide track", async () => {
    const ensureAudioContext = vi.fn(async () => ({}));
    const awaitGuideTrack = vi.fn(async () => {});
    const replayTick = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };

    await finalizePlaybackMonitorSessionSetupState({
      ensureAudioContext,
      guideTrackPathRef: { current: "/music/replay.wav" },
      guideTrackQueueRef: { current: [] },
      guideTrackRef: { current: null },
      guideTrackLoadPromiseRef: { current: Promise.resolve() },
      awaitGuideTrack,
      replayTick,
      logger,
    });

    expect(ensureAudioContext).toHaveBeenCalled();
    expect(awaitGuideTrack).toHaveBeenCalled();
    expect(replayTick).toHaveBeenCalled();
  });

  it("starts replay hydration only when the prepared session needs it", () => {
    const rebuildReplayEventsFromSource = vi.fn(async () => [createEvent(0), createEvent(1)]);
    const setTimeoutFn = vi.fn(() => 123);
    const replayTick = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };

    maybeHydratePlaybackReplayState({
      prepared: {
        session: createPlaybackMonitorSession({
          sessionId: "persisted-1",
          label: "Replay",
          sourcePath: "/logs/replay.log",
        }),
        events: [],
        shouldHydrateReplay: true,
      },
      hydrationToken: 1,
      replayHydrationTokenRef: { current: 1 },
      sessionRef: { current: createSession() as ActiveMonitorSession | null },
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: true },
      activeRef: { current: true },
      playbackPausedRef: { current: false },
      pollTimerRef: { current: null },
      syncReplayTelemetry: vi.fn(),
      rebuildReplayEventsFromSource,
      setTimeoutFn,
      replayTick,
      logger,
    });

    expect(rebuildReplayEventsFromSource).toHaveBeenCalled();
  });
});
