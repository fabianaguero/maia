import { type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { LiveLogStreamUpdate } from "../../../types/library";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import { useLiveLogMonitorBackgroundBus } from "./useLiveLogMonitorBackgroundBus";
import { useLiveLogMonitorBackgroundMutation } from "./useLiveLogMonitorBackgroundMutation";

export function useLiveLogMonitorBackgroundAudioEngine(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  masterGainRef: MutableRefObject<GainNode | null>;
  backgroundGainRef: MutableRefObject<GainNode | null>;
  backgroundDryGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveWetGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveNodeRef: MutableRefObject<WaveShaperNode | null>;
  filterNodeRef: MutableRefObject<BiquadFilterNode | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  selectedStyleProfile: {
    backgroundGain: number;
    filterBaseHz: number;
    filterCeilingHz: number;
  };
  selectedMutationProfile: {
    backgroundDucking: number;
    filterSweepMultiplier: number;
    anomalyBoostMultiplier: number;
    transitionTightness: number;
  };
  forcedLiveMutationState: ForcedLiveMutationState;
  liveEnabled: boolean;
  setLiveMutationState: Dispatch<SetStateAction<LiveMutationState>>;
}): {
  ensureBackgroundBus: (context: AudioContext) => void;
  applyLogModulation: (update: LiveLogStreamUpdate) => void;
} {
  const ensureBackgroundBus = useLiveLogMonitorBackgroundBus({
    masterGainRef: input.masterGainRef,
    backgroundGainRef: input.backgroundGainRef,
    backgroundDryGainRef: input.backgroundDryGainRef,
    backgroundDriveWetGainRef: input.backgroundDriveWetGainRef,
    backgroundDriveNodeRef: input.backgroundDriveNodeRef,
    filterNodeRef: input.filterNodeRef,
    selectedStyleProfile: {
      backgroundGain: input.selectedStyleProfile.backgroundGain,
      filterCeilingHz: input.selectedStyleProfile.filterCeilingHz,
    },
  });

  const { applyLogModulation } = useLiveLogMonitorBackgroundMutation(input);

  return { ensureBackgroundBus, applyLogModulation };
}
