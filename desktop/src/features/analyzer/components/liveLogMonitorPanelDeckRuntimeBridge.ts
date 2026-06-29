import { stopBeatLooper } from "./liveLogMonitorBeatRuntime";
import { setBlobAudioVolumeState, stopManagedBlobAudioState } from "./liveLogMonitorAudioRuntime";
import { toMessage } from "./liveLogMonitorViewModel";
import {
  buildLiveLogMonitorDeckBookmarkCallbacks,
  buildLiveLogMonitorDeckPlaybackCallbacks,
  type LiveLogMonitorDeckOperatorActions,
} from "./liveLogMonitorPanelDeckCallbacksRuntime";
import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";
import type { useLiveLogMonitorDeckModel } from "./useLiveLogMonitorDeckModel";

type LiveDeckModelState = ReturnType<typeof useLiveLogMonitorDeckModel>;

export function buildLiveLogMonitorSessionActionsInput(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
) {
  const surfaceState = input.surfaceState;

  return {
    repository: input.repository,
    adapterKind: surfaceState.adapterKind,
    ensureAudioReady: input.ensureAudioReady,
    monitor: input.monitor,
    referenceAnchorBpm: input.referenceAnchorBpm,
    useBeatGrid: input.scene.preset.useBeatGrid,
    rhythmDivision: input.scene.preset.rhythmDivision,
    audioContextRef: surfaceState.audioContextRef,
    beatClockRef: surfaceState.beatClockRef,
    beatLooperRef: surfaceState.beatLooperRef,
    bounceCuesRef: surfaceState.bounceCuesRef,
    masterVolume: surfaceState.masterVolume,
    toMessage,
    applyStartReset: input.applyStartReset,
    applyStopReset: input.applyStopReset,
    setBeatClockBpm: surfaceState.setBeatClockBpm,
    setBeatLooperActive: surfaceState.setBeatLooperActive,
    setRecentWarnings: (updater: Parameters<typeof surfaceState.setRecentWarnings>[0]) =>
      surfaceState.setRecentWarnings(updater),
    setError: surfaceState.setError,
    setIsStarting: surfaceState.setIsStarting,
    ensureBackgroundAudio: input.ensureBackgroundAudio,
    stopBackgroundDeck: input.stopBackgroundDeck,
    stopBeatLooper: () => stopBeatLooper(surfaceState.beatLooperRef),
    muteManagedBlobAudio: () => {
      setBlobAudioVolumeState(input.activeBlobAudioElements, 0);
      stopManagedBlobAudioState(input.activeBlobAudioElements);
    },
    backgroundGainRef: surfaceState.backgroundGainRef,
    backgroundDryGainRef: surfaceState.backgroundDryGainRef,
    backgroundDriveWetGainRef: surfaceState.backgroundDriveWetGainRef,
    backgroundDriveNodeRef: surfaceState.backgroundDriveNodeRef,
    filterNodeRef: surfaceState.filterNodeRef,
    masterGainRef: surfaceState.masterGainRef,
    analyserRef: surfaceState.analyserRef,
  };
}

export function buildLiveLogMonitorOperatorActionsInput(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
) {
  const surfaceState = input.surfaceState;

  return {
    repositoryId: input.repository.id,
    basePlaylist: surfaceState.basePlaylist,
    selectedStyleProfileId: surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: surfaceState.selectedMutationProfileId,
    replayFeedbackRecommendation: input.replayFeedbackRecommendation,
    recentExplanations: surfaceState.recentExplanations,
    replayActive: input.replayActive,
    playbackEventCount: input.monitor.playbackEventCount,
    previousAudibleVolumeRef: surfaceState.previousAudibleVolumeRef,
    setSelectedStyleProfileId: surfaceState.setSelectedStyleProfileId,
    setSelectedMutationProfileId: surfaceState.setSelectedMutationProfileId,
    setSelectedExplanationId: surfaceState.setSelectedExplanationId,
    setBackgroundPlayheadSecond: surfaceState.setBackgroundPlayheadSecond,
    setMasterVolume: surfaceState.setMasterVolume,
    monitor: {
      pausePlayback: input.monitor.pausePlayback,
      seekPlaybackProgress: input.monitor.seekPlaybackProgress,
    },
  };
}

export function buildLiveLogMonitorDeckModelInput(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
  operatorActions: LiveLogMonitorDeckOperatorActions,
) {
  const surfaceState = input.surfaceState;
  const playbackCallbacks = buildLiveLogMonitorDeckPlaybackCallbacks(input);
  const bookmarkCallbacks = buildLiveLogMonitorDeckBookmarkCallbacks(input, operatorActions);

  return {
    t: input.t,
    repository: input.repository,
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    playbackPercent: input.playbackPercent,
    playbackWindowLabel: input.playbackWindowLabel,
    playbackProgress: input.monitor.playbackProgress,
    playbackEventCount: input.monitor.playbackEventCount,
    playbackEventIndex: input.monitor.playbackEventIndex,
    isPlaybackPaused: input.monitor.isPlaybackPaused,
    persistedSessionId: input.replaySessionId,
    sessionRepoTitle: input.monitor.session?.repoTitle ?? null,
    sessionRepoId: input.monitor.session?.repoId ?? null,
    session: input.monitor.session,
    metrics: input.monitor.metrics,
    bounceWindowCount: surfaceState.bounceWindowCount,
    beatClockBpm: surfaceState.beatClockBpm,
    beatLooperActive: surfaceState.beatLooperActive,
    backgroundPlayheadSecond: surfaceState.backgroundPlayheadSecond,
    backgroundNowPlayingTrack: input.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: input.backgroundTransitionNextTrack,
    backgroundTransitionPlan: surfaceState.backgroundTransitionPlan,
    availableTracks: input.availableTracks,
    availablePlaylists: input.availablePlaylists,
    availableBaseAssets: input.availableBaseAssets,
    availableCompositions: input.availableCompositions,
    availableBaseTrackOptions: input.availableBaseTrackOptions,
    basePlaylist: surfaceState.basePlaylist,
    baseTrackCount: input.baseTrackCount,
    hasBaseListeningBed: input.hasBaseListeningBed,
    adapterDescription: input.adapterDescription,
    adapterTarget: input.adapterTarget,
    activeAdapterLabel: input.activeAdapterLabel,
    cueEnginePreviewLabel: input.cueEnginePreviewLabel,
    liveMutationStateLabel: input.liveMutationStateLabel,
    lastUpdate: surfaceState.lastUpdate,
    recentMarkers: surfaceState.recentMarkers,
    recentWarnings: surfaceState.recentWarnings,
    recentCues: surfaceState.recentCues,
    recentVoices: surfaceState.recentVoices,
    recentExplanations: surfaceState.recentExplanations,
    selectedExplanationId: surfaceState.selectedExplanationId,
    selectedTraceExplanation: input.selectedTraceExplanation,
    traceWaveformTrack: input.traceWaveformTrack,
    traceWaveformExplanations: input.traceWaveformExplanations,
    traceWaveformCues: input.traceWaveformCues,
    activeTailWindowId: surfaceState.activeTailWindowId,
    syncTailRows: surfaceState.syncTailRows,
    analyserRef: surfaceState.analyserRef,
    syncTailListRef: surfaceState.syncTailListRef,
    error: surfaceState.error,
    isAnomalyFlash: surfaceState.isAnomalyFlash,
    audioStatus: surfaceState.audioStatus,
    sampleStatus: surfaceState.sampleStatus,
    sampleSourceCount: input.scene.sampleSourceCount,
    emittedCueCount: surfaceState.emittedCueCount,
    emittedVoiceCount: surfaceState.emittedVoiceCount,
    selectedStyleProfile: input.selectedStyleProfile,
    selectedMutationProfile: input.selectedMutationProfile,
    scene: input.scene,
    sceneBaseAssetId: surfaceState.sceneBaseAssetId,
    sceneCompositionId: surfaceState.sceneCompositionId,
    knownComponents: surfaceState.knownComponents,
    componentOverrides: surfaceState.componentOverrides,
    masterVolume: surfaceState.masterVolume,
    replayFeedbackRecommendation: input.replayFeedbackRecommendation,
    activeReplayBookmark: input.activeReplayBookmark,
    sortedSessionBookmarks: input.sortedSessionBookmarks,
    bookmarkLabelDraft: input.bookmarkLabelDraft,
    bookmarkNoteDraft: input.bookmarkNoteDraft,
    bookmarkTagDraft: input.bookmarkTagDraft,
    bookmarkStyleProfileIdDraft: input.bookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft: input.bookmarkMutationProfileIdDraft,
    bookmarkBusy: input.bookmarkBusy,
    bookmarkError: input.bookmarkError,
    setComponentOverrides: surfaceState.setComponentOverrides,
    setSceneBaseAssetId: surfaceState.setSceneBaseAssetId,
    setSceneCompositionId: surfaceState.setSceneCompositionId,
    onSequencerStepFire: input.handleSequencerStepFire,
    ...playbackCallbacks,
    ...bookmarkCallbacks,
  };
}

export function buildLiveLogMonitorPanelRenderStateInput(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
  liveDeckProps: LiveDeckModelState,
  sessionActions: {
    handleStart: () => Promise<void>;
    handleStop: () => void;
    handleBounce: () => void;
  },
) {
  const surfaceState = input.surfaceState;

  return {
    t: input.t,
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    activeAdapterLabel: input.activeAdapterLabel,
    audioStatus: surfaceState.audioStatus,
    adapterKind: surfaceState.adapterKind,
    adapterDescription: input.adapterDescription,
    adapterTarget: input.adapterTarget,
    selectedStyleProfileId: surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: surfaceState.selectedMutationProfileId,
    selectedStyleProfile: input.selectedStyleProfile,
    selectedMutationProfile: input.selectedMutationProfile,
    forcedLiveMutationState: surfaceState.forcedLiveMutationState,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    adapterConfigured: true,
    cueEnginePreviewLabel: input.cueEnginePreviewLabel,
    liveMutationStateLabel: input.liveMutationStateLabel,
    error: surfaceState.error,
    isStarting: surfaceState.isStarting,
    pendingAddTrackId: surfaceState.pendingAddTrackId,
    pendingLoadPlaylistId: surfaceState.pendingLoadPlaylistId,
    basePlaylist: surfaceState.basePlaylist,
    basePlaylistTrackOptions: liveDeckProps.basePlaylistTrackOptions,
    savedPlaylistOptions: liveDeckProps.savedPlaylistOptions,
    basePlaylistEditorItems: liveDeckProps.basePlaylistEditorItems,
    availablePlaylists: input.availablePlaylists,
    availableTracks: input.availableTracks,
    setBasePlaylist: surfaceState.setBasePlaylist,
    setPendingAddTrackId: surfaceState.setPendingAddTrackId,
    setPendingLoadPlaylistId: surfaceState.setPendingLoadPlaylistId,
    setAdapterKind: surfaceState.setAdapterKind,
    setSelectedStyleProfileId: surfaceState.setSelectedStyleProfileId,
    setSelectedMutationProfileId: surfaceState.setSelectedMutationProfileId,
    setForcedLiveMutationState: surfaceState.setForcedLiveMutationState,
    ctaMetaLabel: liveDeckProps.ctaMetaLabel,
    deckStatusLabel: liveDeckProps.deckStatusLabel,
    audioBadgeTone: liveDeckProps.audioBadgeTone,
    audioBadgeLabel: liveDeckProps.audioBadgeLabel,
    bounceAction: liveDeckProps.bounceAction,
    onEnsureAudioReady: () => void input.ensureAudioReady(),
    onPlayTestTone: () => void input.playPanelTestTone(),
    onStop: () => sessionActions.handleStop(),
    onBounce: () => sessionActions.handleBounce(),
    onStart: () => void sessionActions.handleStart(),
    liveDeckProps: liveDeckProps.liveDeckProps,
  };
}
