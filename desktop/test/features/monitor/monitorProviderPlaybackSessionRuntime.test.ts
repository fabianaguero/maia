import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  activateAndBootstrapPlaybackSessionState,
  startMonitorProviderPlaybackSessionState,
} from "../../../src/features/monitor/monitorProviderPlaybackSessionRuntime";
import type { PreparedPlaybackMonitorSession } from "../../../src/features/monitor/monitorPlaybackRuntime";

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

function createPrepared(): PreparedPlaybackMonitorSession {
  return {
    session: {
      sessionId: "playback_persisted-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "Night watch",
      sourcePath: "/logs/replay.log",
      adapterKind: "file",
      pollMode: "direct",
      startedAt: 1,
    },
    events: [createEvent(0), createEvent(1)],
    shouldHydrateReplay: true,
  };
}

function createSharedInput() {
  return {
    sessionRef: { current: null },
    activeRef: { current: false },
    isPlaybackRef: { current: false },
    playbackPausedRef: { current: false },
    replayEventsRef: { current: [] as SessionEvent[] },
    replayMetricsRef: { current: [{ windowCount: 0, processedLines: 0, totalAnomalies: 0 }] },
    replayIndexRef: { current: 0 },
    replayHydratingRef: { current: false },
    replayHydrationTokenRef: { current: 0 },
    pollTimerRef: { current: null as number | null },
    setSession: vi.fn(),
    setIsPlayback: vi.fn(),
    setIsPlaybackPaused: vi.fn(),
    setMetrics: vi.fn(),
    syncReplayTelemetry: vi.fn(),
    ensureAudioContext: vi.fn(async () => undefined),
    guideTrackPathRef: { current: null as string | null },
    guideTrackQueueRef: { current: [] as string[] },
    guideTrackRef: { current: null },
    guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    awaitGuideTrack: vi.fn(async () => undefined),
    replayTick: vi.fn(),
    rebuildReplayEventsFromSource: vi.fn(async () => [createEvent(0)]),
    setTimeoutFn: vi.fn(() => 1),
    logger: { info: vi.fn(), warn: vi.fn() },
  };
}

describe("monitorProviderPlaybackSessionRuntime", () => {
  it("activates playback state and returns the hydration token", async () => {
    const input = createSharedInput();

    const hydrationToken = await activateAndBootstrapPlaybackSessionState({
      prepared: createPrepared(),
      ...input,
    });

    expect(hydrationToken).toBe(1);
    expect(input.setSession).toHaveBeenCalled();
    expect(input.setIsPlayback).toHaveBeenCalledWith(true);
    expect(input.ensureAudioContext).toHaveBeenCalled();
    expect(input.setTimeoutFn).toHaveBeenCalledWith(input.replayTick, 120);
  });

  it("starts provider playback sessions after clearing any active poll loop", async () => {
    const input = createSharedInput();
    const stopPolling = vi.fn();
    const loadSessionEvents = vi.fn(async () => [createEvent(0), createEvent(1)]);
    input.sessionRef.current = {
      sessionId: "live-1",
      persistedSessionId: null,
      repoId: "repo-live",
      repoTitle: "Live",
      sourcePath: "/logs/live.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: 1,
    };

    const ok = await startMonitorProviderPlaybackSessionState({
      sessionId: "persisted-1",
      label: "Night watch",
      sourcePath: "/logs/replay.log",
      repoId: "repo-1",
      trackId: "track-1",
      trackTitle: "Replay Track",
      stopPolling,
      loadSessionEvents,
      ...input,
    });

    expect(ok).toBe(true);
    expect(stopPolling).toHaveBeenCalled();
    expect(loadSessionEvents).toHaveBeenCalledWith("persisted-1");
    expect(input.setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        trackId: "track-1",
        trackName: "Replay Track",
      }),
    );
  });
});
