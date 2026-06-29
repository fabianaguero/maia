import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import { buildMonitorContextValue } from "../../../src/features/monitor/monitorContextValue";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../../src/features/monitor/monitorContextTypes";

describe("monitorContextValue", () => {
  it("builds a stable provider snapshot from the monitor context contract", async () => {
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
    const resumePlayback = vi.fn(async () => undefined);
    const stepPlaybackWindow = vi.fn();
    const subscribe = vi.fn(() => () => undefined);
    const resumeAudio = vi.fn(async () => undefined);
    const setActiveTemplate = vi.fn();

    const value = buildMonitorContextValue({
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
      subscribe,
      audioContext: null,
      resumeAudio,
      activeTemplate,
      setActiveTemplate,
    });

    expect(value.session).toBe(session);
    expect(value.metrics).toBe(metrics);
    expect(value.activeTemplate).toBe(activeTemplate);
    expect(value.setGuideTrack).toBe(setGuideTrack);
    expect(value.playbackSession).toBe(playbackSession);
    expect(value.resumeAudio).toBe(resumeAudio);
    expect(value.startSession).toBe(startSession);
  });
});
