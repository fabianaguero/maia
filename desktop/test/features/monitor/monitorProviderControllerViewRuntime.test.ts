import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderContextValueInput,
  buildMonitorProviderGuideTrackInput,
  buildMonitorProviderPlaybackControlsInput,
} from "../../../src/features/monitor/monitorProviderControllerViewRuntime";

function createState() {
  return {
    session: { sessionId: "session-1" },
    metrics: { totalAnomalies: 3, totalLines: 12 },
    isPlayback: true,
    guideTrackReady: true,
    guideTrackPath: "/tracks/base.wav",
    playbackProgress: 0.4,
    isPlaybackPaused: false,
    playbackEventIndex: 4,
    playbackEventCount: 10,
    guideTrackDurationSec: 180,
    audioContext: { state: "running" } as AudioContext,
    activeTemplate: { id: "template-active", label: "Active template" },
    setGuideTrackReady: vi.fn(),
    setGuideTrackPathState: vi.fn(),
    setGuideTrackDurationSec: vi.fn(),
    setActiveTemplateState: vi.fn(),
    setIsPlaybackPaused: vi.fn(),
    audioContextRef: { current: null },
    listenersRef: { current: new Set() },
    currentSegmentRef: { current: null },
    guideTrackPathRef: { current: null as string | null },
    guideTrackQueueRef: { current: [] as string[] },
    guideTrackQueueIndexRef: { current: 0 },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    activeTemplateRef: { current: { id: "template-active", label: "Active template" } },
    replayEventsRef: { current: [] },
    replayIndexRef: { current: 0 },
    pollTimerRef: { current: null as number | null },
    playbackPausedRef: { current: false },
    activeRef: { current: true },
  };
}

describe("monitorProviderControllerViewRuntime", () => {
  it("builds guide track hook input from provider state", () => {
    const state = createState();
    const resolveSourceTemplate = vi.fn();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const decodedAudioCache = new Map();

    const result = buildMonitorProviderGuideTrackInput({
      state,
      resolveSourceTemplate,
      decodedAudioCache,
      logger,
    });

    expect(result).toEqual(
      expect.objectContaining({
        resolveSourceTemplate,
        decodedAudioCache,
        logger,
        audioContextRef: state.audioContextRef,
        guideTrackQueueRef: state.guideTrackQueueRef,
        activeTemplateRef: state.activeTemplateRef,
      }),
    );
  });

  it("builds playback controls input from provider state and orchestration", () => {
    const state = createState();
    const dispatchReplayEventAtIndex = vi.fn();
    const replayTick = vi.fn();

    const result = buildMonitorProviderPlaybackControlsInput({
      state,
      orchestration: {
        dispatchReplayEventAtIndex,
        replayTick,
      },
      intervalMs: 600,
    });

    expect(result).toEqual(
      expect.objectContaining({
        isPlayback: true,
        replayEventsRef: state.replayEventsRef,
        pollTimerRef: state.pollTimerRef,
        dispatchReplayEventAtIndex,
        replayTick,
        intervalMs: 600,
      }),
    );
  });

  it("builds monitor context input from grouped controller outputs", () => {
    const state = createState();
    const guideTrack = {
      setActiveTemplate: vi.fn(),
      seekGuideTrack: vi.fn(),
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
    };
    const sessionActions = {
      startSession: vi.fn(),
      attachSession: vi.fn(),
      stopSession: vi.fn(),
      playbackSession: vi.fn(),
    };
    const playbackControls = {
      seekPlaybackProgress: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    };
    const orchestration = {
      resumeAudio: vi.fn(),
    };
    const logger = {
      info: vi.fn(),
    };

    const result = buildMonitorProviderContextValueInput({
      state,
      guideTrack,
      sessionActions,
      playbackControls,
      orchestration,
      logger,
    });

    expect(result).toEqual(
      expect.objectContaining({
        session: state.session,
        metrics: state.metrics,
        setGuideTrack: guideTrack.setGuideTrack,
        playbackSession: sessionActions.playbackSession,
        stepPlaybackWindow: playbackControls.stepPlaybackWindow,
        resumeAudio: orchestration.resumeAudio,
        listenersRef: state.listenersRef,
        logger,
      }),
    );
  });
});
