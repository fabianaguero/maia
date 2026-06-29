import type { LiveLogMonitorViewModelInput } from "./liveLogMonitorViewModel";
import type { UseLiveLogMonitorPanelRuntimeStateInput } from "./useLiveLogMonitorPanelRuntimeState";
import type { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import type { useLiveLogMonitorPanelAudioRuntime } from "./useLiveLogMonitorPanelAudioRuntime";
import type { useLiveLogMonitorReplayState } from "./useLiveLogMonitorReplayState";
import type { Logger } from "../../../utils/logger";

type LiveLogMonitorViewState = ReturnType<typeof buildLiveLogMonitorViewModel>;
type LiveLogMonitorAudioRuntime = ReturnType<typeof useLiveLogMonitorPanelAudioRuntime>;
type LiveLogMonitorReplayRuntime = ReturnType<typeof useLiveLogMonitorReplayState>;

export function buildLiveLogMonitorViewModelInput(
  input: UseLiveLogMonitorPanelRuntimeStateInput,
): LiveLogMonitorViewModelInput {
  const { repository, availableBaseAssets, availableCompositions, availableTracks, monitor, replayActive, surfaceState } = input;

  return {
    repository,
    repositoryId: repository.id,
    adapterKind: surfaceState.adapterKind,
    sessionRepoId: monitor.session?.repoId ?? null,
    sessionAdapterKind: monitor.session?.adapterKind ?? null,
    availableBaseAssets,
    availableCompositions,
    availableTracks,
    basePlaylist: surfaceState.basePlaylist,
    sceneBaseAssetId: surfaceState.sceneBaseAssetId,
    sceneCompositionId: surfaceState.sceneCompositionId,
    selectedStyleProfileId: surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: surfaceState.selectedMutationProfileId,
    recentExplanations: surfaceState.recentExplanations,
    selectedExplanationId: surfaceState.selectedExplanationId,
    backgroundNowPlayingId: surfaceState.backgroundNowPlayingId,
    backgroundTransitionPlan: surfaceState.backgroundTransitionPlan,
    replayActive,
    playbackEventIndex: monitor.playbackEventIndex,
    forcedLiveMutationState: surfaceState.forcedLiveMutationState,
    liveMutationState: surfaceState.liveMutationState,
    sampleStatus: surfaceState.sampleStatus,
  };
}

export function buildLiveLogMonitorPanelAudioRuntimeInput(
  input: UseLiveLogMonitorPanelRuntimeStateInput,
  viewState: LiveLogMonitorViewState,
  logger: Logger,
) {
  return {
    repositoryId: input.repository.id,
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    monitorAudioContext: input.monitor.audioContext,
    resumeSharedAudio: input.monitor.resumeAudio,
    surfaceState: input.surfaceState,
    viewState: {
      playableBaseTracks: viewState.playableBaseTracks,
      playableBaseTrackIdsKey: viewState.playableBaseTrackIdsKey,
      scene: viewState.scene,
      selectedStyleProfile: viewState.selectedStyleProfile,
      selectedMutationProfile: viewState.selectedMutationProfile,
      effectiveLiveMutationState: viewState.effectiveLiveMutationState,
    },
    logger,
  };
}

export function buildLiveLogMonitorReplayStateInput(
  input: UseLiveLogMonitorPanelRuntimeStateInput,
  viewState: LiveLogMonitorViewState,
) {
  return {
    replayActive: input.replayActive,
    persistedSessionId: input.monitor.session?.persistedSessionId,
    playbackEventIndex: input.monitor.playbackEventIndex,
    selectedStyleProfileId: input.surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: input.surfaceState.selectedMutationProfileId,
    currentReplayExplanation: viewState.currentReplayExplanation,
    traceWaveformTrack: viewState.traceWaveformTrack,
    backgroundPlayheadSecond: input.surfaceState.backgroundPlayheadSecond,
  };
}

export function buildLiveLogMonitorPanelRuntimeStateValue(
  viewState: LiveLogMonitorViewState,
  audioRuntime: LiveLogMonitorAudioRuntime,
  replayState: LiveLogMonitorReplayRuntime,
) {
  return {
    activeBlobAudioElements: audioRuntime.activeBlobAudioElements,
    currentReplayExplanation: viewState.currentReplayExplanation,
    selectedStyleProfile: viewState.selectedStyleProfile,
    selectedMutationProfile: viewState.selectedMutationProfile,
    availableBaseTrackOptions: viewState.availableBaseTrackOptions,
    backgroundNowPlayingTrack: viewState.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: viewState.backgroundTransitionNextTrack,
    traceWaveformTrack: viewState.traceWaveformTrack,
    traceWaveformExplanations: viewState.traceWaveformExplanations,
    selectedTraceExplanation: viewState.selectedTraceExplanation,
    traceWaveformCues: viewState.traceWaveformCues,
    referenceAnchor: viewState.referenceAnchor,
    scene: viewState.scene,
    baseTrackCount: viewState.baseTrackCount,
    hasBaseListeningBed: viewState.hasBaseListeningBed,
    activeAdapterLabel: viewState.activeAdapterLabel,
    adapterDescription: viewState.adapterDescription,
    adapterTarget: viewState.adapterTarget,
    liveMutationStateLabel: viewState.liveMutationStateLabel,
    cueEnginePreviewLabel: viewState.cueEnginePreviewLabel,
    replayState,
    ensureAudioReady: audioRuntime.ensureAudioReady,
    playPanelTestTone: audioRuntime.playPanelTestTone,
    backgroundDeckControl: audioRuntime.backgroundDeckControl,
    resetActions: audioRuntime.resetActions,
    applyLogModulation: audioRuntime.applyLogModulation,
    playbackRuntime: audioRuntime.playbackRuntime,
  };
}
