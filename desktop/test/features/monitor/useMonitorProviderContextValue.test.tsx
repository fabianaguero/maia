import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import { useMonitorProviderContextValue } from "../../../src/features/monitor/useMonitorProviderContextValue";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
  StreamListener,
} from "../../../src/features/monitor/monitorContextTypes";

describe("useMonitorProviderContextValue", () => {
  it("builds the public context value and wires subscribe to the listener registry", () => {
    const session: ActiveMonitorSession = {
      sessionId: "session-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "repo",
      trackId: "track-1",
      trackName: "track",
      sourcePath: "/logs/app.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: 123,
    };
    const metrics: MonitorMetrics = {
      windowCount: 2,
      processedLines: 40,
      totalAnomalies: 3,
    };
    const activeTemplate = resolveSourceTemplate("melodic-techno");
    const listeners = new Set<StreamListener>();
    const listenersRef = { current: listeners };
    const logger = { info: vi.fn() };
    const setGuideTrack = vi.fn();
    const setGuideTrackPlaylist = vi.fn();
    const seekGuideTrack = vi.fn();
    const startSession = vi.fn(async () => true);
    const attachSession = vi.fn(async () => true);
    const stopSession = vi.fn(async () => undefined);
    const playbackSession = vi.fn(async () => true);
    const seekPlaybackProgress = vi.fn();
    const seekPlaybackWindow = vi.fn();
    const pausePlayback = vi.fn();
    const resumePlayback = vi.fn();
    const stepPlaybackWindow = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const setActiveTemplate = vi.fn();

    const { result } = renderHook(() =>
      useMonitorProviderContextValue({
        session,
        metrics,
        isPlayback: false,
        guideTrackReady: true,
        guideTrackPath: "/tracks/a.wav",
        playbackProgress: 0.5,
        isPlaybackPaused: false,
        playbackEventIndex: 4,
        playbackEventCount: 9,
        guideTrackDurationSec: 188,
        setGuideTrack,
        setGuideTrackPlaylist,
        seekGuideTrack,
        startSession,
        attachSession,
        stopSession,
        playbackSession,
        seekPlaybackProgress,
        seekPlaybackWindow,
        pausePlayback,
        resumePlayback,
        stepPlaybackWindow,
        audioContext: null,
        resumeAudio,
        activeTemplate,
        setActiveTemplate,
        listenersRef,
        logger,
      }),
    );

    expect(result.current.session).toBe(session);
    expect(result.current.metrics).toBe(metrics);
    expect(result.current.activeTemplate).toBe(activeTemplate);

    const listener = vi.fn();
    const unsubscribe = result.current.subscribe(listener);

    expect(listeners.has(listener)).toBe(true);
    unsubscribe();
    expect(listeners.has(listener)).toBe(false);
    expect(logger.info).toHaveBeenCalled();
  });
});
