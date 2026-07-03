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
