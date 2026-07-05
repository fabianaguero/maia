import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorPanelDeckRuntimeState,
  useLiveLogMonitorPanelDeckHookState,
} from "../../src/features/analyzer/components/liveLogMonitorPanelDeckRuntime";

const useLiveLogMonitorSessionActionsMock = vi.fn();
const useLiveLogMonitorOperatorActionsMock = vi.fn();
const useLiveLogMonitorDeckModelMock = vi.fn();
const buildLiveLogMonitorPanelRenderStateMock = vi.fn();

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorSessionActions", () => ({
  useLiveLogMonitorSessionActions: (...args: unknown[]) =>
    useLiveLogMonitorSessionActionsMock(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorOperatorActions", () => ({
  useLiveLogMonitorOperatorActions: (...args: unknown[]) =>
    useLiveLogMonitorOperatorActionsMock(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorDeckModel", () => ({
  useLiveLogMonitorDeckModel: (...args: unknown[]) => useLiveLogMonitorDeckModelMock(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorPanelRenderState", () => ({
  buildLiveLogMonitorPanelRenderState: (...args: unknown[]) =>
    buildLiveLogMonitorPanelRenderStateMock(...args),
}));

function createInput() {
  return {
    t: { inspect: {}, library: { lost: "lost" } },
    repository: { id: "repo-1" },
    monitor: {
      playbackProgress: 0.42,
      playbackEventCount: 12,
      playbackEventIndex: 4,
      isPlaybackPaused: false,
      session: { repoId: "repo-1", repoTitle: "visits-service" },
      metrics: { totalAnomalies: 2 },
      pausePlayback: vi.fn(),
      seekPlaybackProgress: vi.fn(),
    },
    liveEnabled: true,
    replayActive: true,
    playbackPercent: 42,
    playbackWindowLabel: "4/12",
    availableTracks: [],
    availablePlaylists: [],
    availableBaseAssets: [],
    availableCompositions: [],
    surfaceState: {
      adapterKind: "file",
      audioContextRef: { current: null },
      beatClockRef: { current: null },
      beatLooperRef: { current: null },
      bounceCuesRef: { current: [] },
      masterVolume: 0.7,
      setBeatClockBpm: vi.fn(),
      setBeatLooperActive: vi.fn(),
      setRecentWarnings: vi.fn(),
      setError: vi.fn(),
      setIsStarting: vi.fn(),
      backgroundGainRef: { current: null },
      backgroundDryGainRef: { current: null },
      backgroundDriveWetGainRef: { current: null },
      backgroundDriveNodeRef: { current: null },
      filterNodeRef: { current: null },
      masterGainRef: { current: null },
      analyserRef: { current: null },
      basePlaylist: [],
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
      recentExplanations: [],
      selectedExplanationId: null,
      backgroundPlayheadSecond: 14,
      previousAudibleVolumeRef: { current: 0.6 },
      setSelectedStyleProfileId: vi.fn(),
      setSelectedMutationProfileId: vi.fn(),
      setSelectedExplanationId: vi.fn(),
      setBackgroundPlayheadSecond: vi.fn(),
      setMasterVolume: vi.fn(),
      bounceWindowCount: 0,
      beatClockBpm: 126,
      beatLooperActive: false,
      backgroundTransitionPlan: null,
      recentWarnings: [],
      error: null,
      isStarting: false,
      knownComponents: [],
      componentOverrides: new Map(),
      setComponentOverrides: vi.fn(),
      sceneBaseAssetId: "asset-1",
      setSceneBaseAssetId: vi.fn(),
      sceneCompositionId: "composition-1",
      setSceneCompositionId: vi.fn(),
      audioStatus: "ready",
      sampleStatus: "ready",
      lastUpdate: null,
      emittedCueCount: 0,
      emittedVoiceCount: 0,
      recentCues: [],
      recentVoices: [],
      recentMarkers: [],
      activeTailWindowId: null,
      syncTailRows: [],
      syncTailListRef: { current: null },
      forcedLiveMutationState: "auto",
      setForcedLiveMutationState: vi.fn(),
      pendingAddTrackId: null,
      pendingLoadPlaylistId: null,
      setBasePlaylist: vi.fn(),
      setPendingAddTrackId: vi.fn(),
      setPendingLoadPlaylistId: vi.fn(),
      setAdapterKind: vi.fn(),
      isAnomalyFlash: false,
    },
    selectedStyleProfile: { id: "style-1" },
    selectedMutationProfile: { id: "mutation-1" },
    availableBaseTrackOptions: [],
    backgroundNowPlayingTrack: null,
    backgroundTransitionNextTrack: null,
    traceWaveformTrack: null,
    traceWaveformExplanations: [],
    selectedTraceExplanation: null,
    traceWaveformCues: [],
    currentReplayExplanation: null,
    referenceAnchorBpm: 126,
    scene: {
      preset: {
        useBeatGrid: true,
        rhythmDivision: 4,
      },
      sampleSourceCount: 0,
    },
    baseTrackCount: 0,
    hasBaseListeningBed: false,
    activeAdapterLabel: "FILE_TAIL",
    adapterDescription: "File tail",
    adapterTarget: "/logs/service.log",
    cueEnginePreviewLabel: "Preview",
    liveMutationStateLabel: "Calm",
    replaySessionId: "session-1",
    replayFeedbackRecommendation: null,
    sortedSessionBookmarks: [],
    activeReplayBookmark: null,
    bookmarkLabelDraft: "",
    setBookmarkLabelDraft: vi.fn(),
    bookmarkNoteDraft: "",
    setBookmarkNoteDraft: vi.fn(),
    bookmarkTagDraft: null,
    setBookmarkTagDraft: vi.fn(),
    bookmarkStyleProfileIdDraft: null,
    setBookmarkStyleProfileIdDraft: vi.fn(),
    bookmarkMutationProfileIdDraft: null,
    setBookmarkMutationProfileIdDraft: vi.fn(),
    bookmarkBusy: false,
    bookmarkError: null,
    captureCurrentScene: vi.fn(),
    saveReplayBookmark: vi.fn(),
    deleteReplayBookmark: vi.fn(),
    playPanelTestTone: vi.fn(),
    ensureAudioReady: vi.fn(),
    ensureBackgroundAudio: vi.fn(),
    stopBackgroundDeck: vi.fn(),
    activeBlobAudioElements: new Set(),
    handleSequencerStepFire: vi.fn(),
    applyStartReset: vi.fn(),
    applyStopReset: vi.fn(),
  } as never;
}

describe("liveLogMonitorPanelDeckRuntime", () => {
  it("builds hook state for session/operator/deck dependencies", () => {
    useLiveLogMonitorSessionActionsMock.mockReturnValue({
      handleStart: vi.fn(),
      handleStop: vi.fn(),
      handleBounce: vi.fn(),
    });
    useLiveLogMonitorOperatorActionsMock.mockReturnValue({
      handleSelectTraceExplanation: vi.fn(),
      handleSetMasterVolume: vi.fn(),
    });
    useLiveLogMonitorDeckModelMock.mockReturnValue({
      liveDeckProps: { mode: "live" },
    });

    const input = createInput();
    const state = useLiveLogMonitorPanelDeckHookState(input);

    expect(useLiveLogMonitorSessionActionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: input.repository,
        referenceAnchorBpm: 126,
      }),
    );
    expect(useLiveLogMonitorOperatorActionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        replayActive: true,
      }),
    );
    expect(useLiveLogMonitorDeckModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        playbackPercent: 42,
        playbackWindowLabel: "4/12",
        adapterTarget: "/logs/service.log",
      }),
    );
    expect(state.liveDeckProps).toEqual({ liveDeckProps: { mode: "live" } });
  });

  it("builds final panel deck render state from hook state", () => {
    buildLiveLogMonitorPanelRenderStateMock.mockReturnValue({
      ctaMetaLabel: "BPM 126",
      liveDeckProps: { mode: "live" },
    });

    const result = buildLiveLogMonitorPanelDeckRuntimeState(createInput(), {
      sessionActions: { handleStart: vi.fn() } as never,
      operatorActions: { handleSelectTraceExplanation: vi.fn() } as never,
      liveDeckProps: { liveDeckProps: { mode: "live" } } as never,
    });

    expect(buildLiveLogMonitorPanelRenderStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        activeAdapterLabel: "FILE_TAIL",
        liveEnabled: true,
        replayActive: true,
        liveDeckProps: { mode: "live" },
      }),
    );
    expect(result).toEqual({
      ctaMetaLabel: "BPM 126",
      liveDeckProps: { mode: "live" },
    });
  });
});
