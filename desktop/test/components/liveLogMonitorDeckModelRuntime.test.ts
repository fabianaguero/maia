import { describe, expect, it, vi } from "vitest";

import {
  applyLiveLogMonitorComponentOverride,
  buildLiveLogMonitorComponentOverrideUpdater,
  buildLiveLogMonitorDeckModelState,
} from "../../src/features/analyzer/components/liveLogMonitorDeckModelRuntime";

const buildLiveLogMonitorPanelViewModel = vi.fn();
const buildLiveLogMonitorDeckSectionContent = vi.fn(() => "active-deck");
const buildLiveLogMonitorScenePanel = vi.fn(() => "scene-panel");
const buildLiveLogMonitorRoutingPanel = vi.fn(() => "routing-panel");
const buildLiveLogMonitorLiveDeckProps = vi.fn(() => ({ panel: "deck-props" }));
const updateLiveLogMonitorComponentOverrides = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorPanelViewModel", () => ({
  buildLiveLogMonitorPanelViewModel: (...args: unknown[]) =>
    buildLiveLogMonitorPanelViewModel(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorDeckPropsViewModel", () => ({
  buildLiveLogMonitorDeckSectionContent: (...args: unknown[]) =>
    buildLiveLogMonitorDeckSectionContent(...args),
  buildLiveLogMonitorScenePanel: (...args: unknown[]) => buildLiveLogMonitorScenePanel(...args),
  buildLiveLogMonitorRoutingPanel: (...args: unknown[]) => buildLiveLogMonitorRoutingPanel(...args),
  buildLiveLogMonitorLiveDeckProps: (...args: unknown[]) =>
    buildLiveLogMonitorLiveDeckProps(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorRoutingRuntime", () => ({
  updateLiveLogMonitorComponentOverrides: (...args: unknown[]) =>
    updateLiveLogMonitorComponentOverrides(...args),
}));

function createDeckInput() {
  return {
    t: { inspect: {}, session: {}, library: {} },
    repository: {
      id: "repo-1",
      title: "repo",
      sourcePath: "/logs/app.log",
      suggestedBpm: 126,
    },
    liveEnabled: true,
    replayActive: false,
    playbackPercent: 35,
    playbackWindowLabel: "3/10",
    playbackProgress: 0.35,
    playbackEventCount: 10,
    playbackEventIndex: 3,
    isPlaybackPaused: false,
    persistedSessionId: "session-1",
    sessionRepoTitle: "repo",
    sessionRepoId: "repo-1",
    session: { repoId: "repo-1" },
    metrics: { windowCount: 4, processedLines: 120, totalAnomalies: 2 },
    bounceWindowCount: 7,
    beatClockBpm: 126,
    beatLooperActive: true,
    backgroundPlayheadSecond: 42,
    backgroundNowPlayingTrack: null,
    backgroundTransitionNextTrack: null,
    backgroundTransitionPlan: null,
    availableTracks: [],
    availablePlaylists: [],
    availableBaseAssets: [],
    availableCompositions: [],
    availableBaseTrackOptions: [],
    basePlaylist: { name: "bed", trackIds: [] },
    baseTrackCount: 0,
    hasBaseListeningBed: false,
    adapterDescription: "desc",
    adapterTarget: "target",
    activeAdapterLabel: "FILE",
    cueEnginePreviewLabel: "cue-engine",
    liveMutationStateLabel: "mutation",
    lastUpdate: { summary: "summary", topComponents: [] },
    recentMarkers: [],
    recentWarnings: [],
    recentCues: [],
    recentVoices: [],
    recentExplanations: [],
    selectedExplanationId: null,
    selectedTraceExplanation: null,
    traceWaveformTrack: null,
    traceWaveformExplanations: [],
    traceWaveformCues: [],
    activeTailWindowId: null,
    syncTailRows: [],
    analyserRef: { current: null },
    syncTailListRef: { current: null },
    error: null,
    isAnomalyFlash: false,
    audioStatus: "ready",
    sampleStatus: "ready",
    sampleSourceCount: 2,
    emittedCueCount: 8,
    emittedVoiceCount: 4,
    selectedStyleProfile: { label: "style", description: "style-desc" },
    selectedMutationProfile: { label: "mutation", description: "mutation-desc" },
    scene: { genreId: "house" },
    sceneBaseAssetId: "asset-1",
    sceneCompositionId: "comp-1",
    knownComponents: ["api"],
    componentOverrides: new Map(),
    masterVolume: 0.5,
    replayFeedbackRecommendation: null,
    activeReplayBookmark: null,
    sortedSessionBookmarks: [],
    bookmarkLabelDraft: "",
    bookmarkNoteDraft: "",
    bookmarkTagDraft: null,
    bookmarkStyleProfileIdDraft: null,
    bookmarkMutationProfileIdDraft: null,
    bookmarkBusy: false,
    bookmarkError: null,
    setComponentOverrides: vi.fn(),
    setSceneBaseAssetId: vi.fn(),
    setSceneCompositionId: vi.fn(),
    onSelectExplanation: vi.fn(),
    onSequencerStepFire: vi.fn(),
    onSetMasterVolume: vi.fn(),
    onToggleMute: vi.fn(),
    onStepWindow: vi.fn(),
    onTogglePause: vi.fn(),
    onSeekProgress: vi.fn(),
    onBookmarkLabelChange: vi.fn(),
    onBookmarkNoteChange: vi.fn(),
    onBookmarkTagToggle: vi.fn(),
    onBookmarkStyleProfileChange: vi.fn(),
    onBookmarkMutationProfileChange: vi.fn(),
    onCaptureCurrentScene: vi.fn(),
    onSaveBookmark: vi.fn(),
    onDeleteCurrentBookmark: vi.fn(),
    onJumpToBookmark: vi.fn(),
    onApplyBookmarkSuggestion: vi.fn(),
    onDeleteBookmark: vi.fn(),
    onApplyReplayFeedbackRecommendation: vi.fn(),
  } as never;
}

describe("liveLogMonitorDeckModelRuntime", () => {
  it("assembles deck model state from pure builders", () => {
    buildLiveLogMonitorPanelViewModel.mockReturnValue({
      anomalySourceRows: ["row-a"],
      waveAnomalyMarkers: ["marker-a"],
      liveSourceLabel: "source-label",
      recentSyncTailRows: ["tail-a"],
      deckStatusLabel: "status",
      audioBadgeLabel: "audio",
      audioBadgeTone: "ok",
      bounceAction: "bounce",
      sessionCardDisplay: { title: "session" },
      metricGridItems: ["metric"],
      playlistSummaryItems: ["playlist"],
      basePlaylistEditorItems: ["editor"],
      basePlaylistTrackOptions: ["track-option"],
      savedPlaylistOptions: ["saved-option"],
      nowPlayingSummary: "now",
      upNextSummary: "next",
      windowMetricGridItems: ["window-metric"],
      ctaMetaLabel: "cta-meta",
    });

    const state = buildLiveLogMonitorDeckModelState({
      deckInput: createDeckInput(),
      onOverrideChange: vi.fn(),
    });

    expect(buildLiveLogMonitorPanelViewModel).toHaveBeenCalledWith(
      expect.objectContaining({
        bounceWindowCount: 7,
        repositorySourcePath: "/logs/app.log",
      }),
    );
    expect(buildLiveLogMonitorDeckSectionContent).toHaveBeenCalled();
    expect(buildLiveLogMonitorScenePanel).toHaveBeenCalled();
    expect(buildLiveLogMonitorRoutingPanel).toHaveBeenCalled();
    expect(buildLiveLogMonitorLiveDeckProps).toHaveBeenCalledWith(
      expect.objectContaining({
        activeDeckContent: "active-deck",
        scenePanel: "scene-panel",
        routingPanel: "routing-panel",
      }),
    );
    expect(state.deckStatusLabel).toBe("status");
    expect(state.ctaMetaLabel).toBe("cta-meta");
    expect(state.basePlaylistEditorItems).toEqual(["editor"]);
    expect(state.liveDeckProps).toEqual({ panel: "deck-props" });
  });

  it("builds and applies component override updaters", () => {
    const setComponentOverrides = vi.fn();
    const override = { muted: true } as never;

    const updater = buildLiveLogMonitorComponentOverrideUpdater("api", override);
    updater(new Map());
    applyLiveLogMonitorComponentOverride({
      setComponentOverrides,
      component: "api",
      override,
    });

    expect(updateLiveLogMonitorComponentOverrides).toHaveBeenCalledWith(
      expect.any(Map),
      "api",
      override,
    );
    expect(setComponentOverrides).toHaveBeenCalledWith(expect.any(Function));
  });
});
