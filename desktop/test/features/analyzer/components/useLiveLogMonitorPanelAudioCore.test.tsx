import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelAudioCore } from "../../../../src/features/analyzer/components/useLiveLogMonitorPanelAudioCore";

const inputRuntimeMock = vi.hoisted(() => ({
  buildLiveLogMonitorBackgroundAudioEngineInput: vi.fn(() => ({ engine: true })),
  buildLiveLogMonitorBackgroundDeckControlInput: vi.fn(() => ({ deck: true })),
  buildLiveLogMonitorPlaybackInput: vi.fn(() => ({ playback: true })),
  buildLiveLogMonitorResetActionsInput: vi.fn(() => ({ reset: true })),
}));

const audioBootstrapMock = vi.hoisted(() => ({
  useLiveLogMonitorAudioBootstrap: vi.fn(() => ({ ensureAudioReady: vi.fn() })),
}));

const auxPlaybackMock = vi.hoisted(() => ({
  useLiveLogMonitorAuxPlayback: vi.fn(() => ({
    playRenderedBlobThroughGraph: vi.fn(),
    playPanelTestTone: vi.fn(),
  })),
}));

const backgroundEngineMock = vi.hoisted(() => ({
  useLiveLogMonitorBackgroundAudioEngine: vi.fn(() => ({
    ensureBackgroundBus: vi.fn(),
    applyLogModulation: vi.fn(),
  })),
}));

const backgroundDeckMock = vi.hoisted(() => ({
  useLiveLogMonitorBackgroundDeckControl: vi.fn(() => ({
    stopBackgroundDeck: vi.fn(),
    startBackgroundDeck: vi.fn(),
    scheduleBackgroundTransition: vi.fn(),
  })),
}));

const resetActionsMock = vi.hoisted(() => ({
  useLiveLogMonitorResetActions: vi.fn(() => ({ resetMonitorState: vi.fn() })),
}));

const playbackMock = vi.hoisted(() => ({
  useLiveLogMonitorPlayback: vi.fn(() => ({ triggerCuePlayback: vi.fn() })),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorPanelAudioInputRuntime",
  async () => {
    const actual = await vi.importActual(
      "../../../../src/features/analyzer/components/liveLogMonitorPanelAudioInputRuntime",
    );
    return {
      ...actual,
      ...inputRuntimeMock,
    };
  },
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorAudioBootstrap",
  () => audioBootstrapMock,
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorAuxPlayback",
  () => auxPlaybackMock,
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundAudioEngine",
  () => backgroundEngineMock,
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundDeckControl",
  () => backgroundDeckMock,
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorResetActions",
  () => resetActionsMock,
);
vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorPlayback",
  () => playbackMock,
);

function createInput() {
  return {
    liveEnabled: true,
    replayActive: false,
    monitorAudioContext: null,
    resumeSharedAudio: vi.fn(async () => undefined),
    surfaceState: {
      audioContextRef: { current: null },
      usingSharedAudioContextRef: { current: false },
      masterGainRef: { current: null },
      analyserRef: { current: null },
      sampleBuffersRef: { current: new Map() },
      masterVolume: 0.7,
      backgroundNowPlayingId: "track-1",
      liveMutationState: "warning",
      forcedLiveMutationState: null,
      setAudioStatus: vi.fn(),
      setSampleStatus: vi.fn(),
      setRecentWarnings: vi.fn(),
    },
    viewState: {
      playableBaseTracks: [],
      playableBaseTrackIdsKey: "",
      scene: { sampleSources: [], preset: "hybrid", mutationProfile: "reactive" },
      selectedStyleProfile: {
        backgroundGain: 0.5,
        filterBaseHz: 300,
        filterCeilingHz: 12000,
        playlistCrossfadeSeconds: 8,
        transitionFeel: "smooth",
      },
      selectedMutationProfile: {
        backgroundDucking: 0.2,
        filterSweepMultiplier: 1.1,
        anomalyBoostMultiplier: 1.2,
        transitionTightness: 0.8,
      },
      effectiveLiveMutationState: "warning",
    },
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as never;
}

describe("useLiveLogMonitorPanelAudioCore", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("composes audio runtime hooks and caps sample load warnings", () => {
    const input = createInput();

    const { result } = renderHook(() => useLiveLogMonitorPanelAudioCore(input));

    expect(audioBootstrapMock.useLiveLogMonitorAudioBootstrap).toHaveBeenCalled();
    expect(auxPlaybackMock.useLiveLogMonitorAuxPlayback).toHaveBeenCalled();
    expect(backgroundEngineMock.useLiveLogMonitorBackgroundAudioEngine).toHaveBeenCalledWith({
      engine: true,
      liveEnabled: true,
    });
    expect(backgroundDeckMock.useLiveLogMonitorBackgroundDeckControl).toHaveBeenCalledWith({
      deck: true,
    });
    expect(resetActionsMock.useLiveLogMonitorResetActions).toHaveBeenCalledWith({ reset: true });
    expect(playbackMock.useLiveLogMonitorPlayback).toHaveBeenCalledWith({ playback: true });

    act(() => {
      result.current.handleSampleLoadError("decode failed");
    });

    expect(input.surfaceState.setRecentWarnings).toHaveBeenCalledWith(expect.any(Function));
    const updater = input.surfaceState.setRecentWarnings.mock.calls[0][0] as (
      current: string[],
    ) => string[];
    expect(updater(["w1", "w2", "w3", "w4"])).toEqual([
      "Base sample routing failed: decode failed",
      "w1",
      "w2",
      "w3",
    ]);
  });
});
