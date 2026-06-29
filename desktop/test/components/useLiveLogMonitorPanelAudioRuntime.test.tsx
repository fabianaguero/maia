import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelAudioRuntime } from "../../src/features/analyzer/components/useLiveLogMonitorPanelAudioRuntime";

const useLiveLogMonitorAudioBootstrap = vi.fn();
const useLiveLogMonitorAuxPlayback = vi.fn();
const useLiveLogMonitorBackgroundAudioEngine = vi.fn();
const useLiveLogMonitorBackgroundDeckControl = vi.fn();
const useLiveLogMonitorResetActions = vi.fn();
const useLiveLogMonitorSampleBank = vi.fn();
const useLiveLogMonitorSurfaceSync = vi.fn();
const useLiveLogMonitorBackgroundLifecycle = vi.fn();
const useLiveLogMonitorPlayback = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  createManagedBlobAudioRegistry: () => ({ stopAll: vi.fn() }),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorAudioBootstrap", () => ({
  useLiveLogMonitorAudioBootstrap: (...args: unknown[]) =>
    useLiveLogMonitorAudioBootstrap(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorAuxPlayback", () => ({
  useLiveLogMonitorAuxPlayback: (...args: unknown[]) => useLiveLogMonitorAuxPlayback(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorBackgroundAudioEngine", () => ({
  useLiveLogMonitorBackgroundAudioEngine: (...args: unknown[]) =>
    useLiveLogMonitorBackgroundAudioEngine(...args),
}));

vi.mock(
  "../../src/features/analyzer/components/useLiveLogMonitorBackgroundDeckControl",
  () => ({
    useLiveLogMonitorBackgroundDeckControl: (...args: unknown[]) =>
      useLiveLogMonitorBackgroundDeckControl(...args),
  }),
);

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorResetActions", () => ({
  useLiveLogMonitorResetActions: (...args: unknown[]) => useLiveLogMonitorResetActions(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorSampleBank", () => ({
  useLiveLogMonitorSampleBank: (...args: unknown[]) => useLiveLogMonitorSampleBank(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorSurfaceSync", () => ({
  useLiveLogMonitorSurfaceSync: (...args: unknown[]) => useLiveLogMonitorSurfaceSync(...args),
}));

vi.mock(
  "../../src/features/analyzer/components/useLiveLogMonitorBackgroundLifecycle",
  () => ({
    useLiveLogMonitorBackgroundLifecycle: (...args: unknown[]) =>
      useLiveLogMonitorBackgroundLifecycle(...args),
  }),
);

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPlayback", () => ({
  useLiveLogMonitorPlayback: (...args: unknown[]) => useLiveLogMonitorPlayback(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorBeatRuntime", () => ({
  stopBeatLooper: vi.fn(),
}));

function createSurfaceState() {
  return {
    audioContextRef: { current: null },
    usingSharedAudioContextRef: { current: false },
    masterGainRef: { current: null },
    backgroundGainRef: { current: null },
    analyserRef: { current: null },
    backgroundDryGainRef: { current: null },
    backgroundDriveWetGainRef: { current: null },
    backgroundDriveNodeRef: { current: null },
    sampleBuffersRef: { current: new Map() },
    masterVolume: 0.7,
    setMasterVolume: vi.fn(),
    selectedStyleProfileId: "style-1",
    setSelectedStyleProfileId: vi.fn(),
    selectedMutationProfileId: "mutation-1",
    setSelectedMutationProfileId: vi.fn(),
    basePlaylist: [],
    setBasePlaylist: vi.fn(),
    setPendingAddTrackId: vi.fn(),
    setPendingLoadPlaylistId: vi.fn(),
    beatClockRef: { current: null },
    beatLooperRef: { current: null },
    backgroundDeckRef: { current: null },
    panelAudioProbePlayedRef: { current: false },
    backgroundTransitionTimerRef: { current: null },
    backgroundBufferCacheRef: { current: new Map() },
    filterNodeRef: { current: null },
    setBeatClockBpm: vi.fn(),
    bounceCuesRef: { current: [] },
    setBounceWindowCount: vi.fn(),
    setBeatLooperActive: vi.fn(),
    backgroundNowPlayingId: null,
    setBackgroundNowPlayingId: vi.fn(),
    setBackgroundTransitionPlan: vi.fn(),
    liveMutationState: "steady",
    setLiveMutationState: vi.fn(),
    forcedLiveMutationState: null,
    setForcedLiveMutationState: vi.fn(),
    knownComponentsRef: { current: [] },
    setKnownComponents: vi.fn(),
    setComponentOverrides: vi.fn(),
    setSceneBaseAssetId: vi.fn(),
    setSceneCompositionId: vi.fn(),
    setAudioStatus: vi.fn(),
    sampleStatus: "ready",
    setSampleStatus: vi.fn(),
    setLastUpdate: vi.fn(),
    setEmittedCueCount: vi.fn(),
    setEmittedVoiceCount: vi.fn(),
    setRecentCues: vi.fn(),
    setRecentVoices: vi.fn(),
    setRecentMarkers: vi.fn(),
    setRecentExplanations: vi.fn(),
    setSelectedExplanationId: vi.fn(),
    setBackgroundPlayheadSecond: vi.fn(),
    setRecentWarnings: vi.fn(),
    setError: vi.fn(),
    setIsStarting: vi.fn(),
    syncTailRows: [],
    setSyncTailRows: vi.fn(),
    setActiveTailWindowId: vi.fn(),
    syncTailListRef: { current: null },
    previousAudibleVolumeRef: { current: 0 },
  };
}

describe("useLiveLogMonitorPanelAudioRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLiveLogMonitorAudioBootstrap.mockReturnValue({ ensureAudioReady: vi.fn() });
    useLiveLogMonitorAuxPlayback.mockReturnValue({
      playRenderedBlobThroughGraph: vi.fn(),
      playPanelTestTone: vi.fn(),
    });
    useLiveLogMonitorBackgroundAudioEngine.mockReturnValue({
      ensureBackgroundBus: vi.fn(),
      applyLogModulation: vi.fn(),
    });
    useLiveLogMonitorBackgroundDeckControl.mockReturnValue({
      stopBackgroundDeck: vi.fn(),
      startBackgroundDeck: vi.fn(),
      scheduleBackgroundTransition: vi.fn(),
    });
    useLiveLogMonitorResetActions.mockReturnValue({ applyRepositoryReset: vi.fn() });
    useLiveLogMonitorPlayback.mockReturnValue({ handleSequencerStepFire: vi.fn() });
  });

  it("wires the panel audio/background stack from the derived view state", () => {
    const surfaceState = createSurfaceState();
    const viewState = {
      playableBaseTracks: [],
      playableBaseTrackIdsKey: "track-ids",
      scene: { sampleSources: [], preset: "hybrid", mutationProfile: "reactive" },
      selectedStyleProfile: {
        backgroundGain: 0.8,
        filterBaseHz: 220,
        filterCeilingHz: 1200,
        playlistCrossfadeSeconds: 8,
        transitionFeel: "smooth",
      },
      selectedMutationProfile: {
        backgroundDucking: 0.2,
        filterSweepMultiplier: 1.2,
        anomalyBoostMultiplier: 1.4,
        transitionTightness: 0.5,
      },
      effectiveLiveMutationState: "steady",
    } as never;

    const { result } = renderHook(() =>
      useLiveLogMonitorPanelAudioRuntime({
        repositoryId: "repo-1",
        liveEnabled: true,
        replayActive: false,
        monitorAudioContext: null,
        resumeSharedAudio: vi.fn(async () => undefined),
        surfaceState: surfaceState as never,
        viewState,
        logger: {
          info: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }),
    );

    expect(useLiveLogMonitorAudioBootstrap).toHaveBeenCalled();
    expect(useLiveLogMonitorBackgroundDeckControl).toHaveBeenCalledWith(
      expect.objectContaining({
        playableBaseTracks: [],
        selectedStyleProfile: expect.objectContaining({
          backgroundGain: 0.8,
        }),
      }),
    );
    expect(useLiveLogMonitorSurfaceSync).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        selectedStyleProfileId: "style-1",
      }),
    );
    expect(useLiveLogMonitorPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveLiveMutationState: "steady",
      }),
    );
    expect(result.current.playbackRuntime).toEqual({ handleSequencerStepFire: expect.any(Function) });
  });
});
