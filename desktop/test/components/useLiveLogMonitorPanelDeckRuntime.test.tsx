import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelDeckRuntime } from "../../src/features/analyzer/components/useLiveLogMonitorPanelDeckRuntime";

const buildLiveLogMonitorPanelDeckHookStateMock = vi.fn();
const buildLiveLogMonitorPanelDeckRuntimeStateMock = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorPanelDeckRuntime", () => ({
  useLiveLogMonitorPanelDeckHookState: (...args: unknown[]) =>
    buildLiveLogMonitorPanelDeckHookStateMock(...args),
  buildLiveLogMonitorPanelDeckRuntimeState: (...args: unknown[]) =>
    buildLiveLogMonitorPanelDeckRuntimeStateMock(...args),
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

describe("useLiveLogMonitorPanelDeckRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildLiveLogMonitorPanelDeckHookStateMock.mockReturnValue({
      sessionActions: {
        handleStart: vi.fn(),
        handleStop: vi.fn(),
        handleBounce: vi.fn(),
      },
      operatorActions: {
        handleSelectTraceExplanation: vi.fn(),
        handleSetMasterVolume: vi.fn(),
      },
      liveDeckProps: {
        basePlaylistTrackOptions: [],
        savedPlaylistOptions: [],
        basePlaylistEditorItems: [],
        ctaMetaLabel: "BPM 126",
        deckStatusLabel: "Live",
        audioBadgeTone: "ready",
        audioBadgeLabel: "Audio on",
        bounceAction: null,
        liveDeckProps: { mode: "live" },
      },
    });
    buildLiveLogMonitorPanelDeckRuntimeStateMock.mockReturnValue({
      ctaMetaLabel: "BPM 126",
      liveDeckProps: { mode: "live" },
    });
  });

  it("composes hook state and final render state through the runtime layer", () => {
    const input = createInput();

    const { result } = renderHook(() => useLiveLogMonitorPanelDeckRuntime(input));

    expect(buildLiveLogMonitorPanelDeckHookStateMock).toHaveBeenCalledWith(input);
    expect(buildLiveLogMonitorPanelDeckRuntimeStateMock).toHaveBeenCalledWith(
      input,
      expect.objectContaining({
        sessionActions: expect.objectContaining({
          handleStart: expect.any(Function),
        }),
        operatorActions: expect.objectContaining({
          handleSelectTraceExplanation: expect.any(Function),
        }),
        liveDeckProps: expect.objectContaining({
          ctaMetaLabel: "BPM 126",
        }),
      }),
    );
    expect(result.current).toEqual({
      ctaMetaLabel: "BPM 126",
      liveDeckProps: { mode: "live" },
    });
  });
});
