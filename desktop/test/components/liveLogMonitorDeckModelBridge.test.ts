import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorDeckModelReturnValue,
  buildLiveLogMonitorDeckSectionContentInput,
  buildLiveLogMonitorLiveDeckPropsInput,
  buildLiveLogMonitorPanelViewModelInput,
  buildLiveLogMonitorRoutingPanelInput,
  buildLiveLogMonitorScenePanelInput,
} from "../../src/features/analyzer/components/liveLogMonitorDeckModelBridge";

function createInput() {
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

describe("liveLogMonitorDeckModelBridge", () => {
  it("builds stable panel, section, scene, routing, deck and return snapshots", () => {
    const input = createInput();
    const panelViewState = {
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
    } as never;
    const activeDeckContent = "active-deck" as never;
    const scenePanel = "scene-panel" as never;
    const routingPanel = "routing-panel" as never;
    const liveDeckProps = { panel: "deck-props" } as never;

    expect(buildLiveLogMonitorPanelViewModelInput(input)).toMatchObject({
      bounceWindowCount: 7,
      repositorySourcePath: "/logs/app.log",
      maxSyncTailLines: 60,
    });
    expect(buildLiveLogMonitorDeckSectionContentInput(input, panelViewState)).toMatchObject({
      liveSourceLabel: "source-label",
      anomalySourceRows: ["row-a"],
    });
    expect(buildLiveLogMonitorScenePanelInput(input)).toMatchObject({
      sceneBaseAssetId: "asset-1",
      sceneCompositionId: "comp-1",
    });
    expect(
      buildLiveLogMonitorRoutingPanelInput({
        knownComponents: ["api"],
        componentOverrides: input.componentOverrides,
        liveActive: true,
        onOverrideChange: vi.fn(),
      }),
    ).toMatchObject({
      knownComponents: ["api"],
      liveActive: true,
    });
    expect(
      buildLiveLogMonitorLiveDeckPropsInput(
        input,
        panelViewState,
        activeDeckContent,
        scenePanel,
        routingPanel,
      ),
    ).toMatchObject({
      sessionRepoTitle: "repo",
      activeDeckContent: "active-deck",
      scenePanel: "scene-panel",
      routingPanel: "routing-panel",
    });
    expect(buildLiveLogMonitorDeckModelReturnValue(panelViewState, liveDeckProps)).toEqual({
      anomalySourceRows: ["row-a"],
      recentSyncTailRows: ["tail-a"],
      deckStatusLabel: "status",
      audioBadgeLabel: "audio",
      audioBadgeTone: "ok",
      bounceAction: "bounce",
      basePlaylistEditorItems: ["editor"],
      basePlaylistTrackOptions: ["track-option"],
      savedPlaylistOptions: ["saved-option"],
      ctaMetaLabel: "cta-meta",
      liveDeckProps: { panel: "deck-props" },
    });
  });
});
