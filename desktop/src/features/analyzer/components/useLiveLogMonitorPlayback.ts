import { useEffectEvent, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { RoutedLiveCue, ArrangementTrack } from "./liveSonificationScene";
import type { LibraryTrack } from "../../../types/library";
import type { BeatClock } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import {
  executeLiveLogMonitorPlaybackWindow,
  playLiveLogMonitorSequencerPreview,
  type LiveLogMonitorPlaybackLogger,
} from "./liveLogMonitorPlaybackEventRuntime";

export interface LiveLogMonitorPlaybackInput {
  audioContextRef: MutableRefObject<AudioContext | null>;
  masterGainRef: MutableRefObject<GainNode | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  sampleBuffersRef: MutableRefObject<Map<string, AudioBuffer>>;
  beatClockRef: MutableRefObject<BeatClock | null>;
  bounceCuesRef: MutableRefObject<RoutedLiveCue[][]>;
  masterVolume: number;
  scene: {
    preset: {
      maxCuesPerWindow: number;
      useBeatGrid: boolean;
      rhythmDivision: number;
      scheduleGapMs: number;
    };
    mutationProfile: {
      arrangementDepth: string;
    };
  };
  effectiveLiveMutationState: LiveMutationState;
  sampleStatus: "unavailable" | "loading" | "ready" | "error";
  playableBaseTracks: LibraryTrack[];
  playRenderedBlobThroughGraph: (blob: Blob, volume: number) => Promise<void>;
  setBounceWindowCount: Dispatch<SetStateAction<number>>;
  setEmittedVoiceCount: Dispatch<SetStateAction<number>>;
  logger: LiveLogMonitorPlaybackLogger;
}

export function useLiveLogMonitorPlayback(input: LiveLogMonitorPlaybackInput) {
  const playWithCurrentEngine = useEffectEvent((cues: RoutedLiveCue[], liveBpm?: number | null) => {
    const result = executeLiveLogMonitorPlaybackWindow({
      cues,
      liveBpm,
      audioContext: input.audioContextRef.current,
      masterGain: input.masterGainRef.current,
      backgroundDeck: input.backgroundDeckRef.current,
      sampleBuffers: input.sampleBuffersRef.current,
      beatClock: input.beatClockRef.current,
      bounceCueWindows: input.bounceCuesRef.current,
      masterVolume: input.masterVolume,
      scene: input.scene,
      effectiveLiveMutationState: input.effectiveLiveMutationState,
      sampleStatus: input.sampleStatus,
      playableBaseTracks: input.playableBaseTracks,
      playRenderedBlobThroughGraph: input.playRenderedBlobThroughGraph,
      logger: input.logger,
    });

    input.bounceCuesRef.current = result.nextBounceCueWindows;
    if (result.bounceWindowCount !== null) {
      input.setBounceWindowCount(result.bounceWindowCount);
    }
    if (result.emittedVoiceCount > 0) {
      input.setEmittedVoiceCount((current) => current + result.emittedVoiceCount);
    }
  });

  const handleSequencerStepFire = useEffectEvent(
    (
      firings: Array<{
        track: ArrangementTrack;
        step: number;
        humanizeOffsetMs: number;
      }>,
    ) => {
      playLiveLogMonitorSequencerPreview({
        firings,
        masterVolume: input.masterVolume,
        playRenderedBlobThroughGraph: input.playRenderedBlobThroughGraph,
      });
    },
  );

  return {
    playWithCurrentEngine,
    handleSequencerStepFire,
  };
}
