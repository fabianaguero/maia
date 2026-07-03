import type { Logger } from "../../../utils/logger";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
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
