import { stopBeatLooper } from "./liveLogMonitorBeatRuntime";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";

type LiveLogMonitorSurfaceState = ReturnType<typeof useLiveLogMonitorSurfaceState>;

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
