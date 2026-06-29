import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import {
  hydrateReplayFromSourceState,
  maybeHydratePlaybackReplayState,
} from "../../../src/features/monitor/monitorReplayHydrationRuntime";
import { createPlaybackMonitorSession } from "../../../src/features/monitor/monitorPlaybackRuntime";

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

describe("monitorReplayHydrationRuntime", () => {
  it("hydrates replay events from source and reschedules tick", async () => {
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

  it("starts hydration only when replay source rebuild is needed", () => {
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
