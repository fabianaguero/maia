import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMonitorProviderState } from "../../../src/features/monitor/useMonitorProviderState";

function createTemplate() {
  return {
    id: "house-file-tail",
    label: "House",
    description: "steady house template",
    bpm: 126,
    density: 0.6,
    swing: 0.1,
    genre: "house",
    defaultInstrumentRole: "drums",
  } as const;
}

describe("useMonitorProviderState", () => {
  it("initializes monitor state, refs and template defaults", () => {
    const template = createTemplate();
    const { result } = renderHook(() => useMonitorProviderState({ initialTemplate: template }));

    expect(result.current.session).toBeNull();
    expect(result.current.isPlayback).toBe(false);
    expect(result.current.guideTrackReady).toBe(false);
    expect(result.current.guideTrackPath).toBeNull();
    expect(result.current.playbackProgress).toBeNull();
    expect(result.current.isPlaybackPaused).toBe(false);
    expect(result.current.playbackEventIndex).toBeNull();
    expect(result.current.playbackEventCount).toBeNull();
    expect(result.current.guideTrackDurationSec).toBeNull();
    expect(result.current.audioContext).toBeNull();
    expect(result.current.activeTemplate).toEqual(template);
    expect(result.current.metrics).toEqual({
      processedLines: 0,
      totalAnomalies: 0,
      windowCount: 0,
    });

    expect(result.current.audioContextRef.current).toBeNull();
    expect(result.current.pollTimerRef.current).toBeNull();
    expect(result.current.sessionRef.current).toBeNull();
    expect(result.current.listenersRef.current.size).toBe(0);
    expect(result.current.activeRef.current).toBe(false);
    expect(result.current.guideTrackRef.current).toBeNull();
    expect(result.current.guideTrackCursorRef.current.current).toBe(0);
    expect(result.current.guideTrackFinishedRef.current).toBe(false);
    expect(result.current.directCursorRef.current).toBeUndefined();
    expect(result.current.replayEventsRef.current).toEqual([]);
    expect(result.current.replayMetricsRef.current).toEqual([
      { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
    ]);
    expect(result.current.replayIndexRef.current).toBe(0);
    expect(result.current.replayHydratingRef.current).toBe(false);
    expect(result.current.replayHydrationTokenRef.current).toBe(0);
    expect(result.current.playbackPausedRef.current).toBe(false);
    expect(result.current.emptyWindowsRef.current).toBe(0);
    expect(result.current.wsRef.current).toBeNull();
    expect(result.current.wsLineBufferRef.current).toEqual([]);
    expect(result.current.httpUrlRef.current).toBe("");
    expect(result.current.pollIndexRef.current).toBe(0);
    expect(result.current.isPlaybackRef.current).toBe(false);
    expect(result.current.guideTrackPathRef.current).toBeNull();
    expect(result.current.guideTrackQueueRef.current).toEqual([]);
    expect(result.current.guideTrackQueueIndexRef.current).toBe(0);
    expect(result.current.guideTrackLoadPromiseRef.current).toBeNull();
    expect(result.current.currentSegmentRef.current).toBeNull();
    expect(result.current.activeTemplateRef.current).toEqual(template);
  });

  it("updates the main observable state slices through the exposed setters", () => {
    const template = createTemplate();
    const { result } = renderHook(() => useMonitorProviderState({ initialTemplate: template }));

    act(() => {
      result.current.setSession({
        sessionId: "session-1",
        repoId: "repo-1",
        repoTitle: "visits-service",
        sourcePath: "/logs/visits-service.log",
        adapterKind: "file",
        pollMode: "session",
        startedAt: 10,
      });
      result.current.setIsPlayback(true);
      result.current.setMetrics({
        processedLines: 42,
        totalAnomalies: 3,
        windowCount: 8,
      });
      result.current.setGuideTrackReady(true);
      result.current.setGuideTrackPathState("/tracks/guide.wav");
      result.current.setPlaybackProgress(0.75);
      result.current.setIsPlaybackPaused(true);
      result.current.setPlaybackEventIndex(5);
      result.current.setPlaybackEventCount(12);
      result.current.setGuideTrackDurationSec(182);
      result.current.setAudioContext({ state: "running" } as AudioContext);
      result.current.setActiveTemplateState({
        ...template,
        id: "glitch",
        label: "Glitch",
      });
    });

    expect(result.current.session?.sessionId).toBe("session-1");
    expect(result.current.isPlayback).toBe(true);
    expect(result.current.metrics).toEqual({
      processedLines: 42,
      totalAnomalies: 3,
      windowCount: 8,
    });
    expect(result.current.guideTrackReady).toBe(true);
    expect(result.current.guideTrackPath).toBe("/tracks/guide.wav");
    expect(result.current.playbackProgress).toBe(0.75);
    expect(result.current.isPlaybackPaused).toBe(true);
    expect(result.current.playbackEventIndex).toBe(5);
    expect(result.current.playbackEventCount).toBe(12);
    expect(result.current.guideTrackDurationSec).toBe(182);
    expect(result.current.audioContext?.state).toBe("running");
    expect(result.current.activeTemplate.id).toBe("glitch");
  });
});
