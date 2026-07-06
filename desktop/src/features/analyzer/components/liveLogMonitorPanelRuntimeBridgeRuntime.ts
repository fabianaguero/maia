import type { LiveLogStreamUpdate } from "../../../types/library";
import type { UseLiveLogMonitorPanelRuntimeInput } from "./useLiveLogMonitorPanelRuntime";
import type { useLiveLogMonitorPanelRuntimeState } from "./useLiveLogMonitorPanelRuntimeState";

type LiveLogMonitorPanelRuntimeState = ReturnType<typeof useLiveLogMonitorPanelRuntimeState>;

export function buildLiveLogMonitorOrchestratorInputSlices(input: {
  panelInput: UseLiveLogMonitorPanelRuntimeInput;
  runtimeState: LiveLogMonitorPanelRuntimeState;
}) {
  return {
    monitorSlice: {
      repositoryId: input.panelInput.repository.id,
      sessionRepoId: input.panelInput.monitor.session?.repoId ?? null,
      monitor: {
        isPlayback: input.panelInput.monitor.isPlayback,
      },
      replayActive: input.panelInput.replayActive,
    },
    surfaceSlice: {
      audioContextRef: input.panelInput.surfaceState.audioContextRef,
      backgroundDeckRef: input.panelInput.surfaceState.backgroundDeckRef,
      beatClockRef: input.panelInput.surfaceState.beatClockRef,
      panelAudioProbePlayedRef: input.panelInput.surfaceState.panelAudioProbePlayedRef,
      componentOverrides: input.panelInput.surfaceState.componentOverrides,
      knownComponentsRef: input.panelInput.surfaceState.knownComponentsRef,
      setLastUpdate: input.panelInput.surfaceState.setLastUpdate,
      setRecentWarnings: input.panelInput.surfaceState.setRecentWarnings,
      setError: input.panelInput.surfaceState.setError,
      setSyncTailRows: input.panelInput.surfaceState.setSyncTailRows,
      setActiveTailWindowId: input.panelInput.surfaceState.setActiveTailWindowId,
      setIsAnomalyFlash: input.panelInput.surfaceState.setIsAnomalyFlash,
      setEmittedCueCount: input.panelInput.surfaceState.setEmittedCueCount,
      setRecentCues: input.panelInput.surfaceState.setRecentCues,
      setRecentMarkers: input.panelInput.surfaceState.setRecentMarkers,
      setRecentExplanations: input.panelInput.surfaceState.setRecentExplanations,
      setBackgroundPlayheadSecond: input.panelInput.surfaceState.setBackgroundPlayheadSecond,
      setSelectedExplanationId: input.panelInput.surfaceState.setSelectedExplanationId,
      setRecentVoices: input.panelInput.surfaceState.setRecentVoices,
      setKnownComponents: input.panelInput.surfaceState.setKnownComponents,
      setBeatClockBpm: input.panelInput.surfaceState.setBeatClockBpm,
    },
    runtimeSlice: {
      scene: input.runtimeState.scene,
      availableTracks: input.panelInput.availableTracks,
      ensureAudioReady: input.runtimeState.ensureAudioReady,
      playWithCurrentEngine: input.runtimeState.playbackRuntime.playWithCurrentEngine,
      applyLogModulation: input.runtimeState.applyLogModulation,
      playPanelTestTone: input.runtimeState.playPanelTestTone,
    },
  };
}

export function buildLiveLogMonitorLifecycleInputSlices(input: {
  panelInput: UseLiveLogMonitorPanelRuntimeInput;
  runtimeState: LiveLogMonitorPanelRuntimeState;
  onStreamUpdate: (update: LiveLogStreamUpdate) => void;
}) {
  return {
    selectionSlice: {
      repository: input.panelInput.repository,
      availableBaseAssets: input.panelInput.availableBaseAssets,
      availableCompositions: input.panelInput.availableCompositions,
      availableTracks: input.panelInput.availableTracks,
      preferredBaseAssetId: input.panelInput.preferredBaseAssetId,
      preferredCompositionId: input.panelInput.preferredCompositionId,
      basePlaylist: input.panelInput.surfaceState.basePlaylist,
    },
    monitorSlice: {
      guideTrackPath: input.panelInput.monitor.guideTrackPath,
      replayActive: input.panelInput.replayActive,
      onStreamUpdate: input.onStreamUpdate,
      subscribe: input.panelInput.monitor.subscribe,
    },
    runtimeSlice: {
      activeBlobAudioElements: input.runtimeState.activeBlobAudioElements,
      audioContextRef: input.panelInput.surfaceState.audioContextRef,
      usingSharedAudioContextRef: input.panelInput.surfaceState.usingSharedAudioContextRef,
      setSceneBaseAssetId: input.panelInput.surfaceState.setSceneBaseAssetId,
      setSceneCompositionId: input.panelInput.surfaceState.setSceneCompositionId,
      setBasePlaylist: input.panelInput.surfaceState.setBasePlaylist,
      applyRepositoryReset: input.runtimeState.resetActions.applyRepositoryReset,
    },
  };
}

export function buildLiveLogMonitorDeckRuntimeInputSlices(input: {
  panelInput: UseLiveLogMonitorPanelRuntimeInput;
  runtimeState: LiveLogMonitorPanelRuntimeState;
}) {
  return {
    viewSlice: {
      t: input.panelInput.t,
      repository: input.panelInput.repository,
      monitor: input.panelInput.monitor,
      liveEnabled: input.panelInput.liveEnabled,
      replayActive: input.panelInput.replayActive,
      playbackPercent: input.panelInput.playbackPercent,
      playbackWindowLabel: input.panelInput.playbackWindowLabel,
      availableTracks: input.panelInput.availableTracks,
      availablePlaylists: input.panelInput.availablePlaylists,
      availableBaseAssets: input.panelInput.availableBaseAssets,
      availableCompositions: input.panelInput.availableCompositions,
      surfaceState: input.panelInput.surfaceState,
    },
    runtimeSlice: {
      selectedStyleProfile: input.runtimeState.selectedStyleProfile,
      selectedMutationProfile: input.runtimeState.selectedMutationProfile,
      availableBaseTrackOptions: input.runtimeState.availableBaseTrackOptions,
      backgroundNowPlayingTrack: input.runtimeState.backgroundNowPlayingTrack,
      backgroundTransitionNextTrack: input.runtimeState.backgroundTransitionNextTrack,
      traceWaveformTrack: input.runtimeState.traceWaveformTrack,
      traceWaveformExplanations: input.runtimeState.traceWaveformExplanations,
      selectedTraceExplanation: input.runtimeState.selectedTraceExplanation,
      traceWaveformCues: input.runtimeState.traceWaveformCues,
      currentReplayExplanation: input.runtimeState.currentReplayExplanation,
      referenceAnchorBpm: input.runtimeState.referenceAnchor?.bpm ?? null,
      scene: input.runtimeState.scene,
      baseTrackCount: input.runtimeState.baseTrackCount,
      hasBaseListeningBed: input.runtimeState.hasBaseListeningBed,
      activeAdapterLabel: input.runtimeState.activeAdapterLabel,
      adapterDescription: input.runtimeState.adapterDescription,
      adapterTarget: input.runtimeState.adapterTarget,
      cueEnginePreviewLabel: input.runtimeState.cueEnginePreviewLabel,
      liveMutationStateLabel: input.runtimeState.liveMutationStateLabel,
    },
    replaySlice: {
      replaySessionId: input.runtimeState.replayState.replaySessionId,
      replayFeedbackRecommendation: input.runtimeState.replayState.replayFeedbackRecommendation,
      sortedSessionBookmarks: input.runtimeState.replayState.sortedSessionBookmarks,
      activeReplayBookmark: input.runtimeState.replayState.activeReplayBookmark,
      bookmarkLabelDraft: input.runtimeState.replayState.bookmarkLabelDraft,
      setBookmarkLabelDraft: input.runtimeState.replayState.setBookmarkLabelDraft,
      bookmarkNoteDraft: input.runtimeState.replayState.bookmarkNoteDraft,
      setBookmarkNoteDraft: input.runtimeState.replayState.setBookmarkNoteDraft,
      bookmarkTagDraft: input.runtimeState.replayState.bookmarkTagDraft,
      setBookmarkTagDraft: input.runtimeState.replayState.setBookmarkTagDraft,
      bookmarkStyleProfileIdDraft: input.runtimeState.replayState.bookmarkStyleProfileIdDraft,
      setBookmarkStyleProfileIdDraft: input.runtimeState.replayState.setBookmarkStyleProfileIdDraft,
      bookmarkMutationProfileIdDraft: input.runtimeState.replayState.bookmarkMutationProfileIdDraft,
      setBookmarkMutationProfileIdDraft:
        input.runtimeState.replayState.setBookmarkMutationProfileIdDraft,
      bookmarkBusy: input.runtimeState.replayState.bookmarkBusy,
      bookmarkError: input.runtimeState.replayState.bookmarkError,
      captureCurrentScene: input.runtimeState.replayState.captureCurrentScene,
      saveReplayBookmark: input.runtimeState.replayState.saveReplayBookmark,
      deleteReplayBookmark: input.runtimeState.replayState.deleteReplayBookmark,
    },
    actionSlice: {
      playPanelTestTone: input.runtimeState.playPanelTestTone,
      ensureAudioReady: input.runtimeState.ensureAudioReady,
      ensureBackgroundAudio: input.runtimeState.backgroundDeckControl.ensureBackgroundAudio,
      stopBackgroundDeck: input.runtimeState.backgroundDeckControl.stopBackgroundDeck,
      activeBlobAudioElements: input.runtimeState.activeBlobAudioElements,
      handleSequencerStepFire: input.runtimeState.playbackRuntime.handleSequencerStepFire,
      applyStartReset: input.runtimeState.resetActions.applyStartReset,
      applyStopReset: input.runtimeState.resetActions.applyStopReset,
    },
  };
}
