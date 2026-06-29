import { stopBeatLooper } from "./liveLogMonitorBeatRuntime";
import type { Logger } from "../../../utils/logger";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";

export const MAX_RECENT_WARNINGS = 4;

type LiveLogMonitorSurfaceState = ReturnType<typeof useLiveLogMonitorSurfaceState>;
type LiveLogMonitorViewState = ReturnType<typeof buildLiveLogMonitorViewModel>;

type LiveLogMonitorPanelAudioViewState = Pick<
  LiveLogMonitorViewState,
  | "playableBaseTracks"
  | "playableBaseTrackIdsKey"
  | "scene"
  | "selectedStyleProfile"
  | "selectedMutationProfile"
  | "effectiveLiveMutationState"
>;

export function buildSampleLoadWarningMessage(message: string) {
  return `Base sample routing failed: ${message}`;
}

export function buildLiveLogMonitorBackgroundAudioEngineInput(
  surfaceState: LiveLogMonitorSurfaceState,
  viewState: LiveLogMonitorPanelAudioViewState,
) {
  return {
    audioContextRef: surfaceState.audioContextRef,
    masterGainRef: surfaceState.masterGainRef,
    backgroundGainRef: surfaceState.backgroundGainRef,
    backgroundDryGainRef: surfaceState.backgroundDryGainRef,
    backgroundDriveWetGainRef: surfaceState.backgroundDriveWetGainRef,
    backgroundDriveNodeRef: surfaceState.backgroundDriveNodeRef,
    filterNodeRef: surfaceState.filterNodeRef,
    backgroundDeckRef: surfaceState.backgroundDeckRef,
    selectedStyleProfile: {
      backgroundGain: viewState.selectedStyleProfile.backgroundGain,
      filterBaseHz: viewState.selectedStyleProfile.filterBaseHz,
      filterCeilingHz: viewState.selectedStyleProfile.filterCeilingHz,
    },
    selectedMutationProfile: {
      backgroundDucking: viewState.selectedMutationProfile.backgroundDucking,
      filterSweepMultiplier: viewState.selectedMutationProfile.filterSweepMultiplier,
      anomalyBoostMultiplier: viewState.selectedMutationProfile.anomalyBoostMultiplier,
      transitionTightness: viewState.selectedMutationProfile.transitionTightness,
    },
    forcedLiveMutationState: surfaceState.forcedLiveMutationState,
    liveEnabled: true,
    setLiveMutationState: surfaceState.setLiveMutationState,
  };
}

export function buildLiveLogMonitorBackgroundDeckControlInput(
  surfaceState: LiveLogMonitorSurfaceState,
  viewState: LiveLogMonitorPanelAudioViewState,
  ensureBackgroundBus: (context: AudioContext) => void,
  toMessage: (error: unknown) => string,
) {
  return {
    audioContextRef: surfaceState.audioContextRef,
    backgroundDeckRef: surfaceState.backgroundDeckRef,
    backgroundTransitionTimerRef: surfaceState.backgroundTransitionTimerRef,
    backgroundBufferCacheRef: surfaceState.backgroundBufferCacheRef,
    filterNodeRef: surfaceState.filterNodeRef,
    playableBaseTracks: viewState.playableBaseTracks,
    selectedStyleProfile: {
      backgroundGain: viewState.selectedStyleProfile.backgroundGain,
      playlistCrossfadeSeconds: viewState.selectedStyleProfile.playlistCrossfadeSeconds,
      transitionFeel: viewState.selectedStyleProfile.transitionFeel,
    },
    selectedMutationProfile: {
      transitionTightness: viewState.selectedMutationProfile.transitionTightness,
    },
    maxRecentWarnings: MAX_RECENT_WARNINGS,
    ensureBackgroundBus,
    setBackgroundNowPlayingId: surfaceState.setBackgroundNowPlayingId,
    setBackgroundTransitionPlan: surfaceState.setBackgroundTransitionPlan,
    setBackgroundPlayheadSecond: surfaceState.setBackgroundPlayheadSecond,
    setRecentWarnings: surfaceState.setRecentWarnings,
    toMessage,
  };
}

export function buildLiveLogMonitorResetActionsInput(surfaceState: LiveLogMonitorSurfaceState) {
  return {
    knownComponentsRef: surfaceState.knownComponentsRef,
    beatClockRef: surfaceState.beatClockRef,
    beatLooperRef: surfaceState.beatLooperRef,
    panelAudioProbePlayedRef: surfaceState.panelAudioProbePlayedRef,
    bounceCuesRef: surfaceState.bounceCuesRef,
    setLastUpdate: surfaceState.setLastUpdate,
    setEmittedCueCount: surfaceState.setEmittedCueCount,
    setEmittedVoiceCount: surfaceState.setEmittedVoiceCount,
    setRecentCues: surfaceState.setRecentCues,
    setRecentVoices: surfaceState.setRecentVoices,
    setRecentMarkers: surfaceState.setRecentMarkers,
    setRecentExplanations: surfaceState.setRecentExplanations,
    setSelectedExplanationId: surfaceState.setSelectedExplanationId,
    setBackgroundPlayheadSecond: surfaceState.setBackgroundPlayheadSecond,
    setRecentWarnings: surfaceState.setRecentWarnings,
    setSyncTailRows: surfaceState.setSyncTailRows,
    setActiveTailWindowId: surfaceState.setActiveTailWindowId,
    setError: surfaceState.setError,
    setKnownComponents: surfaceState.setKnownComponents,
    setComponentOverrides: surfaceState.setComponentOverrides,
    setSceneBaseAssetId: surfaceState.setSceneBaseAssetId,
    setSceneCompositionId: surfaceState.setSceneCompositionId,
    setBasePlaylist: surfaceState.setBasePlaylist,
    setSelectedStyleProfileId: surfaceState.setSelectedStyleProfileId,
    setSelectedMutationProfileId: surfaceState.setSelectedMutationProfileId,
    setMasterVolume: surfaceState.setMasterVolume,
    setPendingAddTrackId: surfaceState.setPendingAddTrackId,
    setPendingLoadPlaylistId: surfaceState.setPendingLoadPlaylistId,
    setBeatClockBpm: surfaceState.setBeatClockBpm,
    setBackgroundNowPlayingId: surfaceState.setBackgroundNowPlayingId,
    setBackgroundTransitionPlan: surfaceState.setBackgroundTransitionPlan,
    setLiveMutationState: surfaceState.setLiveMutationState,
    setForcedLiveMutationState: surfaceState.setForcedLiveMutationState,
    setBeatLooperActive: surfaceState.setBeatLooperActive,
    setIsStarting: surfaceState.setIsStarting,
    setBounceWindowCount: surfaceState.setBounceWindowCount,
    stopBeatLooper: () => stopBeatLooper(surfaceState.beatLooperRef),
  };
}

export function buildLiveLogMonitorSurfaceSyncInput(
  repositoryId: string,
  surfaceState: LiveLogMonitorSurfaceState,
  viewState: LiveLogMonitorPanelAudioViewState,
) {
  return {
    repositoryId,
    basePlaylist: surfaceState.basePlaylist,
    selectedStyleProfileId: surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: surfaceState.selectedMutationProfileId,
    masterVolume: surfaceState.masterVolume,
    audioContextRef: surfaceState.audioContextRef,
    masterGainRef: surfaceState.masterGainRef,
    syncTailListRef: surfaceState.syncTailListRef,
    syncTailRowCount: surfaceState.syncTailRows.length,
    previousAudibleVolumeRef: surfaceState.previousAudibleVolumeRef,
    backgroundGainRef: surfaceState.backgroundGainRef,
    backgroundDryGainRef: surfaceState.backgroundDryGainRef,
    backgroundDriveWetGainRef: surfaceState.backgroundDriveWetGainRef,
    filterNodeRef: surfaceState.filterNodeRef,
    selectedStyleProfile: {
      backgroundGain: viewState.selectedStyleProfile.backgroundGain,
      filterCeilingHz: viewState.selectedStyleProfile.filterCeilingHz,
    },
  };
}

export function buildLiveLogMonitorBackgroundLifecycleInput(
  liveEnabled: boolean,
  surfaceState: LiveLogMonitorSurfaceState,
  viewState: LiveLogMonitorPanelAudioViewState,
  backgroundDeckControl: {
    stopBackgroundDeck: () => void;
    startBackgroundDeck: (
      context: AudioContext,
      trackIndex: number,
      transitionPlan?: PlaylistTransitionPlan | null,
    ) => Promise<void>;
    scheduleBackgroundTransition: (context: AudioContext, deck: BackgroundDeckState) => void;
  },
) {
  return {
    liveEnabled,
    playableBaseTracks: viewState.playableBaseTracks,
    playableBaseTrackIdsKey: viewState.playableBaseTrackIdsKey,
    audioContextRef: surfaceState.audioContextRef,
    backgroundDeckRef: surfaceState.backgroundDeckRef,
    setBackgroundNowPlayingId: surfaceState.setBackgroundNowPlayingId,
    setBackgroundTransitionPlan: () => surfaceState.setBackgroundTransitionPlan(null),
    stopBackgroundDeck: backgroundDeckControl.stopBackgroundDeck,
    startBackgroundDeck: backgroundDeckControl.startBackgroundDeck,
    scheduleBackgroundTransition: backgroundDeckControl.scheduleBackgroundTransition,
  };
}

export function buildLiveLogMonitorPlaybackInput(
  surfaceState: LiveLogMonitorSurfaceState,
  viewState: LiveLogMonitorPanelAudioViewState,
  playRenderedBlobThroughGraph: (blob: Blob, volume: number) => Promise<void>,
  logger: Pick<Logger, "info" | "debug" | "warn">,
) {
  return {
    audioContextRef: surfaceState.audioContextRef,
    masterGainRef: surfaceState.masterGainRef,
    backgroundDeckRef: surfaceState.backgroundDeckRef,
    sampleBuffersRef: surfaceState.sampleBuffersRef,
    beatClockRef: surfaceState.beatClockRef,
    bounceCuesRef: surfaceState.bounceCuesRef,
    masterVolume: surfaceState.masterVolume,
    scene: {
      preset: viewState.scene.preset,
      mutationProfile: viewState.scene.mutationProfile,
    },
    effectiveLiveMutationState: viewState.effectiveLiveMutationState,
    sampleStatus: surfaceState.sampleStatus,
    playableBaseTracks: viewState.playableBaseTracks,
    playRenderedBlobThroughGraph,
    setBounceWindowCount: surfaceState.setBounceWindowCount,
    setEmittedVoiceCount: surfaceState.setEmittedVoiceCount,
    logger,
  };
}
