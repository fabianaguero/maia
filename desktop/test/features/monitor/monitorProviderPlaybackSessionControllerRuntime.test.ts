import { describe, expect, it, vi } from "vitest";

import { buildMonitorProviderPlaybackSessionInput } from "../../../src/features/monitor/monitorProviderPlaybackSessionControllerRuntime";

describe("monitorProviderPlaybackSessionControllerRuntime", () => {
  it("builds playback startup input from grouped provider dependencies", async () => {
    const guideTrackLoadPromise = Promise.resolve();
    const pollLogStream = vi.fn(async () => ({
      sourcePath: "/logs/replay.log",
      fromOffset: 0,
      toOffset: 0,
      replayWindowIndex: null,
      hasData: false,
      summary: "no-data",
      suggestedBpm: 126,
      confidence: 0.8,
      dominantLevel: "info",
      lineCount: 0,
      anomalyCount: 0,
      levelCounts: {},
      anomalyMarkers: [],
      topComponents: [],
      sonificationCues: [],
      parsedLines: [],
      warnings: [],
    }));
    const input = buildMonitorProviderPlaybackSessionInput({
      selection: {
        sessionId: "playback-1",
        label: "Replay session",
        sourcePath: "/logs/replay.log",
        repoId: "repo-2",
      },
      dependencies: {
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
          guideTrackLoadPromiseRef: { current: guideTrackLoadPromise },
        },
        runtime: {
          stopPolling: vi.fn(),
          buildLiveStartInput: vi.fn(() => ({ marker: "unused" }) as never),
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
          pollLogStream,
        },
      },
      setTimeoutFn: vi.fn(() => 1),
    });

    expect(input).toEqual(
      expect.objectContaining({
        sessionId: "playback-1",
        label: "Replay session",
        sourcePath: "/logs/replay.log",
        repoId: "repo-2",
      }),
    );

    await expect(input.awaitGuideTrack()).resolves.toBeUndefined();
    input.guideTrackLoadPromiseRef.current = null;
    await expect(input.awaitGuideTrack()).resolves.toBeUndefined();

    await input.rebuildReplayEventsFromSource({
      sessionId: "playback-1",
      sourcePath: "/logs/replay.log",
    });

    expect(pollLogStream).toHaveBeenCalledWith("/logs/replay.log", 0, 16 * 1024);
  });
});
