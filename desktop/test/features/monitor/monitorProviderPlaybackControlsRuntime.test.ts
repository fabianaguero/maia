import { describe, expect, it, vi, beforeEach } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  hasReplayEvents,
  pauseMonitorPlaybackState,
  resumeMonitorPlaybackState,
  seekMonitorPlaybackProgressState,
  seekMonitorPlaybackWindowState,
  stepMonitorPlaybackWindowState,
} from "../../../src/features/monitor/monitorProviderPlaybackControlsRuntime";
import {
  pauseReplayPlaybackState,
  resumeReplayPlaybackState,
  seekReplayPlaybackState,
  seekReplayWindowState,
  stepReplayPlaybackWindowState,
} from "../../../src/features/monitor/monitorPlaybackRuntime";

vi.mock("../../../src/features/monitor/monitorPlaybackRuntime", () => ({
  pauseReplayPlaybackState: vi.fn(),
  resumeReplayPlaybackState: vi.fn(),
  seekReplayPlaybackState: vi.fn(),
  seekReplayWindowState: vi.fn(),
  stepReplayPlaybackWindowState: vi.fn(),
}));

function createEvent(index: number): SessionEvent {
  return {
    id: index + 1,
    sessionId: "session-1",
    pollIndex: index,
    capturedAt: "2026-06-26T00:00:00.000Z",
    fromOffset: index * 10,
    toOffset: index * 10 + 10,
    summary: `event-${index}`,
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: "info",
    lineCount: 3,
    anomalyCount: 0,
    levelCountsJson: "{}",
    anomalyMarkersJson: "[]",
    topComponentsJson: "[]",
    sonificationCuesJson: "[]",
    parsedLinesJson: "[]",
    warningsJson: "[]",
  };
}

describe("monitorProviderPlaybackControlsRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects replay availability", () => {
    expect(hasReplayEvents({ current: [] })).toBe(false);
    expect(hasReplayEvents({ current: [createEvent(0)] })).toBe(true);
  });

  it("no-op when progress seek is requested outside playback", () => {
    const ok = seekMonitorPlaybackProgressState({
      isPlayback: false,
      progress: 0.4,
      replayEventsRef: { current: [createEvent(0)] },
      replayIndexRef: { current: 0 },
      pollTimerRef: { current: null },
      playbackPausedRef: { current: false },
      activeRef: { current: true },
      guideTrackFinishedRef: { current: false },
      dispatchReplayEventAtIndex: vi.fn(() => true),
      clearTimeoutFn: vi.fn(),
      setTimeoutFn: vi.fn(() => 1),
      intervalMs: 600,
      replayTick: vi.fn(),
    });

    expect(ok).toBe(false);
    expect(seekReplayPlaybackState).not.toHaveBeenCalled();
  });

  it("delegates progress seek and forces guide-track sync", () => {
    const dispatchReplayEventAtIndex = vi.fn(() => true);

    const ok = seekMonitorPlaybackProgressState({
      isPlayback: true,
      progress: 0.25,
      replayEventsRef: { current: [createEvent(0), createEvent(1)] },
      replayIndexRef: { current: 0 },
      pollTimerRef: { current: null },
      playbackPausedRef: { current: false },
      activeRef: { current: true },
      guideTrackFinishedRef: { current: false },
      dispatchReplayEventAtIndex,
      clearTimeoutFn: vi.fn(),
      setTimeoutFn: vi.fn(() => 1),
      intervalMs: 600,
      replayTick: vi.fn(),
    });

    expect(ok).toBe(true);
    expect(seekReplayPlaybackState).toHaveBeenCalledTimes(1);
    const args = vi.mocked(seekReplayPlaybackState).mock.calls[0]?.[0];
    expect(args?.progress).toBe(0.25);
    args?.dispatchReplayEventAtIndex(4);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(4, { syncGuideTrack: true });
  });

  it("delegates window seek only when playback has events", () => {
    const seekPlaybackProgress = vi.fn();

    const ok = seekMonitorPlaybackWindowState({
      isPlayback: true,
      replayWindowIndex: 7,
      replayEventsRef: { current: [createEvent(0)] },
      seekPlaybackProgress,
    });

    expect(ok).toBe(true);
    expect(seekReplayWindowState).toHaveBeenCalledWith({
      replayWindowIndex: 7,
      replayEventsRef: { current: [createEvent(0)] },
      seekPlaybackProgress,
    });
  });

  it("pauses playback only in playback mode", () => {
    const setIsPlaybackPaused = vi.fn();

    expect(
      pauseMonitorPlaybackState({
        isPlayback: false,
        pollTimerRef: { current: null },
        playbackPausedRef: { current: false },
        activeRef: { current: false },
        setIsPlaybackPaused,
        clearTimeoutFn: vi.fn(),
      }),
    ).toBe(false);
    expect(pauseReplayPlaybackState).not.toHaveBeenCalled();

    expect(
      pauseMonitorPlaybackState({
        isPlayback: true,
        pollTimerRef: { current: 12 },
        playbackPausedRef: { current: false },
        activeRef: { current: true },
        setIsPlaybackPaused,
        clearTimeoutFn: vi.fn(),
      }),
    ).toBe(true);
    expect(pauseReplayPlaybackState).toHaveBeenCalledTimes(1);
  });

  it("resumes playback only when replay data exists", () => {
    const dispatchReplayEventAtIndex = vi.fn(() => true);

    expect(
      resumeMonitorPlaybackState({
        isPlayback: true,
        replayEventsRef: { current: [] },
        replayIndexRef: { current: 0 },
        pollTimerRef: { current: null },
        playbackPausedRef: { current: true },
        activeRef: { current: false },
        guideTrackFinishedRef: { current: false },
        dispatchReplayEventAtIndex,
        setIsPlaybackPaused: vi.fn(),
        clearTimeoutFn: vi.fn(),
        setTimeoutFn: vi.fn(() => 1),
        intervalMs: 600,
        replayTick: vi.fn(),
      }),
    ).toBe(false);
    expect(resumeReplayPlaybackState).not.toHaveBeenCalled();

    expect(
      resumeMonitorPlaybackState({
        isPlayback: true,
        replayEventsRef: { current: [createEvent(0)] },
        replayIndexRef: { current: 0 },
        pollTimerRef: { current: null },
        playbackPausedRef: { current: true },
        activeRef: { current: false },
        guideTrackFinishedRef: { current: false },
        dispatchReplayEventAtIndex,
        setIsPlaybackPaused: vi.fn(),
        clearTimeoutFn: vi.fn(),
        setTimeoutFn: vi.fn(() => 1),
        intervalMs: 600,
        replayTick: vi.fn(),
      }),
    ).toBe(true);
    const args = vi.mocked(resumeReplayPlaybackState).mock.calls[0]?.[0];
    args?.dispatchReplayEventAtIndex(2);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(2, { syncGuideTrack: true });
  });

  it("steps playback windows with the same guard and sync behavior", () => {
    const dispatchReplayEventAtIndex = vi.fn(() => true);

    expect(
      stepMonitorPlaybackWindowState({
        isPlayback: true,
        direction: 1,
        replayEventsRef: { current: [createEvent(0), createEvent(1)] },
        replayIndexRef: { current: 0 },
        pollTimerRef: { current: null },
        playbackPausedRef: { current: false },
        activeRef: { current: true },
        guideTrackFinishedRef: { current: false },
        dispatchReplayEventAtIndex,
        setIsPlaybackPaused: vi.fn(),
        clearTimeoutFn: vi.fn(),
      }),
    ).toBe(true);

    const args = vi.mocked(stepReplayPlaybackWindowState).mock.calls[0]?.[0];
    expect(args?.direction).toBe(1);
    args?.dispatchReplayEventAtIndex(3);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(3, { syncGuideTrack: true });
  });
});
