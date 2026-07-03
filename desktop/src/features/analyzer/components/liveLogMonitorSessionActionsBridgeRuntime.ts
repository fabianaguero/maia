import { stopBeatLooper } from "./liveLogMonitorBeatRuntime";
import { setBlobAudioVolumeState, stopManagedBlobAudioState } from "./liveLogMonitorAudioRuntime";
import { toMessage } from "./liveLogMonitorViewModel";
import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";

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
