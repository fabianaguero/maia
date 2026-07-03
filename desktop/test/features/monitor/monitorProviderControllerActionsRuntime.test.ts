import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderControllerActionsResult,
  buildMonitorProviderGuideTrackActionsInput,
  buildMonitorProviderPlaybackControlsInput,
  buildMonitorProviderSessionOrchestrationInput,
} from "../../../src/features/monitor/monitorProviderControllerActionsRuntime";

function createSource() {
  return {
    state: { isPlayback: false, replayEventsRef: { current: [] }, pollTimerRef: { current: null } },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    resolveSourceTemplate: vi.fn((id: string) => ({ id, label: id })),
    decodedAudioCache: new Map(),
    transport: {
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
    },
    sessionApi: {
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
    },
    persistence: {
      updatePersistedSessionCursor: vi.fn(),
      insertSessionEvent: vi.fn(),
      updatePersistedSessionStatus: vi.fn(),
    },
  } as never;
}

describe("monitorProviderControllerActionsRuntime", () => {
  it("builds focused inputs for guide-track and session orchestration hooks", () => {
    const source = createSource();
    const buildReloadPendingGuideTrack = vi.fn(() => vi.fn());

    expect(buildMonitorProviderGuideTrackActionsInput(source)).toEqual({
      state: source.state,
      logger: source.logger,
      resolveSourceTemplate: source.resolveSourceTemplate,
      decodedAudioCache: source.decodedAudioCache,
    });

    expect(
      buildMonitorProviderSessionOrchestrationInput({
        source,
        buildReloadPendingGuideTrack,
      }),
    ).toEqual({
      state: source.state,
      logger: source.logger,
      buildReloadPendingGuideTrack,
      transport: source.transport,
      sessionApi: source.sessionApi,
      persistence: source.persistence,
    });

    expect(
      buildMonitorProviderPlaybackControlsInput({
        state: source.state,
        orchestration: {
          dispatchReplayEventAtIndex: vi.fn(),
          replayTick: vi.fn(),
        },
        intervalMs: 600,
      }),
    ).toEqual(
      expect.objectContaining({
        isPlayback: source.state.isPlayback,
        replayEventsRef: source.state.replayEventsRef,
        pollTimerRef: source.state.pollTimerRef,
      }),
    );
  });

  it("groups public controller actions into stable output bundles", () => {
    const guideTrack = {
      setActiveTemplate: vi.fn(),
      seekGuideTrack: vi.fn(),
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
    };
    const orchestration = {
      resumeAudio: vi.fn(),
    };
    const sessionActions = {
      startSession: vi.fn(),
      attachSession: vi.fn(),
      playbackSession: vi.fn(),
      stopSession: vi.fn(),
    };
    const playbackControls = {
      seekPlaybackProgress: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    };

    expect(
      buildMonitorProviderControllerActionsResult({
        guideTrack,
        orchestration,
        sessionActions,
        playbackControls,
      }),
    ).toEqual({
      guideTrack: {
        setActiveTemplate: guideTrack.setActiveTemplate,
        seekGuideTrack: guideTrack.seekGuideTrack,
        setGuideTrack: guideTrack.setGuideTrack,
        setGuideTrackPlaylist: guideTrack.setGuideTrackPlaylist,
      },
      orchestration: {
        resumeAudio: orchestration.resumeAudio,
      },
      sessionActions,
      playbackControls,
    });
  });
});
