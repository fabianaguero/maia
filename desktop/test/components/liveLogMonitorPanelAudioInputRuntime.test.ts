import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorBackgroundAudioEngineInput,
  buildLiveLogMonitorBackgroundDeckControlInput,
  buildLiveLogMonitorBackgroundLifecycleInput,
  buildLiveLogMonitorPlaybackInput,
  buildLiveLogMonitorResetActionsInput,
  buildLiveLogMonitorSurfaceSyncInput,
  buildSampleLoadWarningMessage,
  MAX_RECENT_WARNINGS,
} from "../../src/features/analyzer/components/liveLogMonitorPanelAudioInputRuntime";

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
    componentOverrides: [],
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

function createViewState() {
  return {
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
  } as const;
}

describe("liveLogMonitorPanelAudioInputRuntime", () => {
  it("builds reusable audio input snapshots from surface and view state", () => {
    const surfaceState = createSurfaceState();
    const viewState = createViewState();
    const ensureBackgroundBus = vi.fn();
    const toMessage = vi.fn();
    const deckControl = {
      stopBackgroundDeck: vi.fn(),
      startBackgroundDeck: vi.fn(),
      scheduleBackgroundTransition: vi.fn(),
    };
    const logger = {
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    expect(buildSampleLoadWarningMessage("boom")).toBe("Base sample routing failed: boom");
    expect(MAX_RECENT_WARNINGS).toBe(4);

    expect(
      buildLiveLogMonitorBackgroundAudioEngineInput(surfaceState as never, viewState as never),
    ).toMatchObject({
      liveEnabled: true,
      selectedStyleProfile: {
        backgroundGain: 0.8,
        filterBaseHz: 220,
      },
    });

    expect(
      buildLiveLogMonitorBackgroundDeckControlInput(
        surfaceState as never,
        viewState as never,
        ensureBackgroundBus,
        toMessage,
      ),
    ).toMatchObject({
      playableBaseTracks: [],
      maxRecentWarnings: 4,
      ensureBackgroundBus,
      toMessage,
    });

    expect(buildLiveLogMonitorResetActionsInput(surfaceState as never)).toMatchObject({
      setBasePlaylist: surfaceState.setBasePlaylist,
      setMasterVolume: surfaceState.setMasterVolume,
      stopBeatLooper: expect.any(Function),
    });

    expect(
      buildLiveLogMonitorSurfaceSyncInput("repo-1", surfaceState as never, viewState as never),
    ).toMatchObject({
      repositoryId: "repo-1",
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
    });

    expect(
      buildLiveLogMonitorBackgroundLifecycleInput(
        true,
        surfaceState as never,
        viewState as never,
        deckControl,
      ),
    ).toMatchObject({
      liveEnabled: true,
      scheduleBackgroundTransition: deckControl.scheduleBackgroundTransition,
    });

    expect(
      buildLiveLogMonitorPlaybackInput(
        surfaceState as never,
        viewState as never,
        vi.fn(),
        logger,
      ),
    ).toMatchObject({
      masterVolume: 0.7,
      effectiveLiveMutationState: "steady",
      logger,
    });
  });
});
