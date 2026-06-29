import type { UseLiveLogMonitorDeckModelInput } from "./useLiveLogMonitorDeckModel";
import type { buildLiveLogMonitorPanelViewModel } from "./liveLogMonitorPanelViewModel";
import type {
  buildLiveLogMonitorDeckSectionContent,
  buildLiveLogMonitorLiveDeckProps,
  buildLiveLogMonitorRoutingPanel,
  buildLiveLogMonitorScenePanel,
} from "./liveLogMonitorDeckPropsViewModel";
import type { ComponentOverride } from "./liveSonificationScene";

type LiveLogMonitorPanelViewState = ReturnType<typeof buildLiveLogMonitorPanelViewModel>;
type LiveLogMonitorActiveDeckContent = ReturnType<typeof buildLiveLogMonitorDeckSectionContent>;
type LiveLogMonitorScenePanelState = ReturnType<typeof buildLiveLogMonitorScenePanel>;
type LiveLogMonitorRoutingPanelState = ReturnType<typeof buildLiveLogMonitorRoutingPanel>;
type LiveLogMonitorLiveDeckPropsState = ReturnType<typeof buildLiveLogMonitorLiveDeckProps>;

export function buildLiveLogMonitorPanelViewModelInput(input: UseLiveLogMonitorDeckModelInput) {
  return {
    t: input.t,
    lastUpdate: input.lastUpdate,
    recentMarkers: input.recentMarkers,
    syncTailRows: input.syncTailRows,
    replayActive: input.replayActive,
    liveEnabled: input.liveEnabled,
    repositorySourcePath: input.repository.sourcePath,
    repositorySuggestedBpm: input.repository.suggestedBpm ?? null,
    audioStatus: input.audioStatus,
    bounceWindowCount: input.bounceWindowCount,
    bounceWindowSeconds: 8,
    sampleStatus: input.sampleStatus,
    sampleSourceCount: input.sampleSourceCount,
    activeAdapterLabel: input.activeAdapterLabel,
    selectedStyleProfileLabel: input.selectedStyleProfile.label,
    selectedMutationProfileLabel: input.selectedMutationProfile.label,
    playbackWindowLabel: input.playbackWindowLabel,
    metrics: input.metrics,
    emittedCueCount: input.emittedCueCount,
    emittedVoiceCount: input.emittedVoiceCount,
    beatClockBpm: input.beatClockBpm,
    beatLooperActive: input.beatLooperActive,
    availableTracks: input.availableTracks,
    availableBaseTrackOptions: input.availableBaseTrackOptions,
    availablePlaylists: input.availablePlaylists,
    basePlaylist: input.basePlaylist,
    backgroundNowPlayingTrack: input.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: input.backgroundTransitionNextTrack,
    backgroundTransitionPlan: input.backgroundTransitionPlan as never,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    playbackPercent: input.playbackPercent,
    session: input.session as never,
    maxSyncTailLines: 60,
    maxAnomalySourceLines: 6,
  };
}

export function buildLiveLogMonitorDeckSectionContentInput(
  input: UseLiveLogMonitorDeckModelInput,
  panelViewState: LiveLogMonitorPanelViewState,
) {
  return {
    t: input.t,
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    playbackEventIndex: input.playbackEventIndex,
    beatClockBpm: input.beatClockBpm,
    repositorySuggestedBpm: input.repository.suggestedBpm ?? null,
    sceneGenreId: input.scene.genreId,
    isAnomalyFlash: input.isAnomalyFlash,
    traceWaveformTrack: input.traceWaveformTrack,
    traceWaveformExplanations: input.traceWaveformExplanations,
    traceWaveformCues: input.traceWaveformCues as never,
    traceWaveformCurrentTime:
      input.selectedTraceExplanation?.trackSecond ?? input.backgroundPlayheadSecond,
    recentExplanations: input.recentExplanations,
    selectedExplanationId: input.selectedExplanationId,
    recentCues: input.recentCues,
    recentVoices: input.recentVoices,
    recentMarkers: input.recentMarkers,
    recentWarnings: input.recentWarnings,
    error: input.error,
    lastUpdateSummary: input.lastUpdate?.summary ?? "",
    lastUpdateTopComponents: input.lastUpdate?.topComponents ?? [],
    windowMetricGridItems: panelViewState.windowMetricGridItems,
    waveAnomalyMarkers: panelViewState.waveAnomalyMarkers,
    liveSourceLabel: panelViewState.liveSourceLabel,
    recentSyncTailRows: panelViewState.recentSyncTailRows,
    anomalySourceRows: panelViewState.anomalySourceRows,
    activeTailWindowId: input.activeTailWindowId,
    syncTailListRef: input.syncTailListRef,
    analyserRef: input.analyserRef,
    onSelectExplanation: input.onSelectExplanation,
    onSequencerStepFire: input.onSequencerStepFire,
  };
}

export function buildLiveLogMonitorScenePanelInput(input: UseLiveLogMonitorDeckModelInput) {
  return {
    availableBaseAssets: input.availableBaseAssets,
    availableCompositions: input.availableCompositions,
    sceneBaseAssetId: input.sceneBaseAssetId,
    sceneCompositionId: input.sceneCompositionId,
    scene: input.scene,
    onSceneBaseAssetIdChange: (value: string) => input.setSceneBaseAssetId(value),
    onSceneCompositionIdChange: (value: string) => input.setSceneCompositionId(value),
  };
}

export function buildLiveLogMonitorRoutingPanelInput(input: {
  knownComponents: string[];
  componentOverrides: Map<string, ComponentOverride>;
  liveActive: boolean;
  onOverrideChange: (component: string, override: ComponentOverride) => void;
}) {
  return {
    knownComponents: input.knownComponents,
    overrides: input.componentOverrides,
    liveActive: input.liveActive,
    onOverrideChange: input.onOverrideChange,
  };
}

export function buildLiveLogMonitorLiveDeckPropsInput(
  input: UseLiveLogMonitorDeckModelInput,
  panelViewState: LiveLogMonitorPanelViewState,
  activeDeckContent: LiveLogMonitorActiveDeckContent,
  scenePanel: LiveLogMonitorScenePanelState,
  routingPanel: LiveLogMonitorRoutingPanelState,
) {
  return {
    t: input.t,
    liveEnabled: input.liveEnabled,
    basePlaylistName: input.basePlaylist?.name ?? null,
    hasBasePlaylist: (input.basePlaylist?.trackIds.length ?? 0) > 0,
    replayActive: input.replayActive,
    playbackProgress: input.playbackProgress,
    playbackPercent: input.playbackPercent,
    playbackWindowLabel: input.playbackWindowLabel,
    isPlaybackPaused: input.isPlaybackPaused,
    playbackEventCount: input.playbackEventCount,
    playbackEventIndex: input.playbackEventIndex,
    replaySessionId: input.replayActive ? (input.persistedSessionId ?? null) : null,
    sessionRepoTitle: input.sessionRepoTitle,
    sessionCardDisplay: panelViewState.sessionCardDisplay,
    metricGridItems: panelViewState.metricGridItems,
    masterVolume: input.masterVolume,
    repositorySourcePath: input.repository.sourcePath,
    playlistSummaryItems: panelViewState.playlistSummaryItems,
    nowPlayingSummary: panelViewState.nowPlayingSummary,
    upNextSummary: panelViewState.upNextSummary,
    selectedStyleProfileDescription: input.selectedStyleProfile.description,
    selectedMutationProfileDescription: input.selectedMutationProfile.description,
    activeReplayBookmark: input.activeReplayBookmark,
    sortedSessionBookmarks: input.sortedSessionBookmarks,
    bookmarkLabelDraft: input.bookmarkLabelDraft,
    bookmarkNoteDraft: input.bookmarkNoteDraft,
    bookmarkTagDraft: input.bookmarkTagDraft,
    bookmarkStyleProfileIdDraft: input.bookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft: input.bookmarkMutationProfileIdDraft,
    bookmarkBusy: input.bookmarkBusy,
    bookmarkError: input.bookmarkError,
    replayFeedbackRecommendation: input.replayFeedbackRecommendation,
    activeDeckContent,
    scenePanel,
    routingPanel,
    onSetMasterVolume: input.onSetMasterVolume,
    onToggleMute: input.onToggleMute,
    onStepWindow: input.onStepWindow,
    onTogglePause: input.onTogglePause,
    onSeekProgress: input.onSeekProgress,
    onBookmarkLabelChange: (event: { target: { value: string } }) =>
      input.onBookmarkLabelChange(event.target.value),
    onBookmarkNoteChange: (event: { target: { value: string } }) =>
      input.onBookmarkNoteChange(event.target.value),
    onBookmarkTagToggle: input.onBookmarkTagToggle,
    onBookmarkStyleProfileChange: (event: { target: { value: string } }) =>
      input.onBookmarkStyleProfileChange(event.target.value || null),
    onBookmarkMutationProfileChange: (event: { target: { value: string } }) =>
      input.onBookmarkMutationProfileChange(event.target.value || null),
    onCaptureCurrentScene: input.onCaptureCurrentScene,
    onSaveBookmark: input.onSaveBookmark,
    onDeleteCurrentBookmark: input.onDeleteCurrentBookmark,
    onJumpToBookmark: input.onJumpToBookmark,
    onApplyBookmarkSuggestion: input.onApplyBookmarkSuggestion,
    onDeleteBookmark: input.onDeleteBookmark,
    onApplyReplayFeedbackRecommendation: input.onApplyReplayFeedbackRecommendation,
  };
}

export function buildLiveLogMonitorDeckModelReturnValue(
  panelViewState: LiveLogMonitorPanelViewState,
  liveDeckProps: LiveLogMonitorLiveDeckPropsState,
) {
  return {
    anomalySourceRows: panelViewState.anomalySourceRows,
    recentSyncTailRows: panelViewState.recentSyncTailRows,
    deckStatusLabel: panelViewState.deckStatusLabel,
    audioBadgeLabel: panelViewState.audioBadgeLabel,
    audioBadgeTone: panelViewState.audioBadgeTone,
    bounceAction: panelViewState.bounceAction,
    basePlaylistEditorItems: panelViewState.basePlaylistEditorItems,
    basePlaylistTrackOptions: panelViewState.basePlaylistTrackOptions,
    savedPlaylistOptions: panelViewState.savedPlaylistOptions,
    ctaMetaLabel: panelViewState.ctaMetaLabel,
    liveDeckProps,
  };
}
