import type { LiveLogMonitorDeckOperatorActions } from "./liveLogMonitorPanelDeckCallbacksRuntime";
import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";

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

export type { LiveLogMonitorDeckOperatorActions };
