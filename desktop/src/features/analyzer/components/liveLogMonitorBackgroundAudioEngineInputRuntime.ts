import type { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";

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

export type { LiveLogMonitorPanelAudioViewState };
