import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  bootstrapLiveMonitorSessionState,
  activateLiveMonitorSessionState,
  activatePlaybackMonitorSessionState,
  replaceExistingMonitorSession,
  resetLivePollingState,
  resetMonitorSessionState,
} from "../../../src/features/monitor/monitorOrchestrationRuntime";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../../src/features/monitor/monitorContextTypes";

function createSession(overrides: Partial<ActiveMonitorSession> = {}): ActiveMonitorSession {
  return {
    sessionId: "stream-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "visits-service",
    sourcePath: "/logs/visits-service.log",
    adapterKind: "file",
    pollMode: "session",
    startedAt: 123,
    ...overrides,
  };
}

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
    anomalyCount: 1,
    levelCountsJson: "{}",
    anomalyMarkersJson: "[]",
    topComponentsJson: "[]",
    sonificationCuesJson: "[]",
    parsedLinesJson: "[]",
    warningsJson: "[]",
  };
}

describe("monitorOrchestrationRuntime", () => {
  it("resets direct polling refs for live monitor starts", () => {
    const directCursorRef = { current: 55 as number | undefined };
    const emptyWindowsRef = { current: 2 };
    const pollIndexRef = { current: 4 };

    resetLivePollingState({
      directCursorRef,
      emptyWindowsRef,
      pollIndexRef,
      startFromBeginning: true,
    });

    expect(directCursorRef.current).toBe(0);
    expect(emptyWindowsRef.current).toBe(0);
    expect(pollIndexRef.current).toBe(0);
  });

  it("activates live monitor session state", () => {
    const session = createSession();
    const sessionRef = { current: null as ActiveMonitorSession | null };
    const activeRef = { current: false };
    const isPlaybackRef = { current: true };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    const resetReplayTelemetry = vi.fn();

    activateLiveMonitorSessionState({
      session,
      sessionRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
    });

    expect(sessionRef.current).toBe(session);
    expect(activeRef.current).toBe(true);
    expect(isPlaybackRef.current).toBe(false);
    expect(setSession).toHaveBeenCalledWith(session);
    expect(setIsPlayback).toHaveBeenCalledWith(false);
    expect(resetReplayTelemetry).toHaveBeenCalledTimes(1);
    expect(setMetrics).toHaveBeenCalledWith({
      windowCount: 0,
      processedLines: 0,
      totalAnomalies: 0,
    } satisfies MonitorMetrics);
  });

  it("bootstraps live monitor session state with template and persisted status", () => {
    const session = createSession();
    const directCursorRef = { current: 55 as number | undefined };
    const emptyWindowsRef = { current: 2 };
    const pollIndexRef = { current: 4 };
    const activeTemplateRef = {
      current: {
        id: "lo-fi-watch",
        label: "Lo-Fi Watch",
        description: "",
        bpm: 85,
        genre: "Lo-Fi",
        styleProfileId: "ambient-watch",
        mutationProfileId: "subtle",
        sourceKind: "generic",
        hint: "",
        icon: "☕",
      },
    };
    const sessionRef = { current: null as ActiveMonitorSession | null };
    const activeRef = { current: false };
    const isPlaybackRef = { current: true };
    const setActiveTemplateState = vi.fn();
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    const resetReplayTelemetry = vi.fn();
    const updatePersistedSessionStatus = vi.fn(async () => undefined);

    bootstrapLiveMonitorSessionState({
      session,
      sourceTemplateId: "tech-house",
      persistedSessionId: "persisted-1",
      startFromBeginning: true,
      directCursorRef,
      emptyWindowsRef,
      pollIndexRef,
      activeTemplateRef,
      setActiveTemplateState,
      updatePersistedSessionStatus,
      sessionRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
    });

    expect(directCursorRef.current).toBe(0);
    expect(emptyWindowsRef.current).toBe(0);
    expect(pollIndexRef.current).toBe(0);
    expect(activeTemplateRef.current.id).toBe("tech-house");
    expect(setActiveTemplateState).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tech-house", bpm: 128 }),
    );
    expect(updatePersistedSessionStatus).toHaveBeenCalledWith("persisted-1", "active");
    expect(sessionRef.current).toBe(session);
    expect(activeRef.current).toBe(true);
    expect(isPlaybackRef.current).toBe(false);
  });

  it("activates playback monitor session state and returns hydration token", () => {
    const session = createSession({
      sessionId: "playback_1",
      pollMode: "direct",
    });
    const events = [createEvent(0), createEvent(1)];
    const cumulativeMetrics: MonitorMetrics[] = [
      { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      { windowCount: 1, processedLines: 4, totalAnomalies: 1 },
      { windowCount: 2, processedLines: 8, totalAnomalies: 1 },
    ];
    const replayHydrationTokenRef = { current: 7 };
    const sessionRef = { current: null as ActiveMonitorSession | null };
    const activeRef = { current: false };
    const isPlaybackRef = { current: false };
    const playbackPausedRef = { current: true };
    const replayEventsRef = { current: [] as SessionEvent[] };
    const replayMetricsRef = { current: [] as MonitorMetrics[] };
    const replayIndexRef = { current: 9 };
    const replayHydratingRef = { current: false };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const setMetrics = vi.fn();
    const syncReplayTelemetry = vi.fn();

    const token = activatePlaybackMonitorSessionState({
      session,
      events,
      cumulativeMetrics,
      shouldHydrateReplay: true,
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

    expect(token).toBe(8);
    expect(sessionRef.current).toBe(session);
    expect(activeRef.current).toBe(true);
    expect(isPlaybackRef.current).toBe(true);
    expect(playbackPausedRef.current).toBe(false);
    expect(replayEventsRef.current).toEqual(events);
    expect(replayMetricsRef.current).toEqual(cumulativeMetrics);
    expect(replayIndexRef.current).toBe(0);
    expect(replayHydratingRef.current).toBe(true);
    expect(syncReplayTelemetry).toHaveBeenCalledWith(0);
  });

  it("resets monitor session state after stop", () => {
    const sessionRef = { current: createSession() as ActiveMonitorSession | null };
    const directCursorRef = { current: 100 as number | undefined };
    const emptyWindowsRef = { current: 3 };
    const activeRef = { current: true };
    const isPlaybackRef = { current: true };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    const resetReplayTelemetry = vi.fn();

    resetMonitorSessionState({
      sessionRef,
      directCursorRef,
      emptyWindowsRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
    });

    expect(sessionRef.current).toBeNull();
    expect(directCursorRef.current).toBeUndefined();
    expect(emptyWindowsRef.current).toBe(0);
    expect(activeRef.current).toBe(false);
    expect(isPlaybackRef.current).toBe(false);
    expect(setSession).toHaveBeenCalledWith(null);
    expect(setIsPlayback).toHaveBeenCalledWith(false);
    expect(resetReplayTelemetry).toHaveBeenCalledTimes(1);
  });

  it("replaces existing sessions with best-effort cleanup", async () => {
    const sessionRef = { current: createSession() as ActiveMonitorSession | null };
    const stopPolling = vi.fn();
    const setSession = vi.fn();
    const stopStreamSession = vi.fn(async () => undefined);

    const previousId = await replaceExistingMonitorSession({
      sessionRef,
      stopPolling,
      setSession,
      stopStreamSession,
    });

    expect(previousId).toBe("stream-1");
    expect(stopPolling).toHaveBeenCalledTimes(1);
    expect(setSession).toHaveBeenCalledWith(null);
    expect(stopStreamSession).toHaveBeenCalledWith("stream-1");
    expect(sessionRef.current).toBeNull();
  });
});
