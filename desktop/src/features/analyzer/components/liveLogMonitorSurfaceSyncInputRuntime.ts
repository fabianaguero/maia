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
