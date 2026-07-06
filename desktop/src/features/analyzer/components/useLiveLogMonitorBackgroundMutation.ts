import {
  useEffect,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type { LiveLogStreamUpdate } from "../../../types/library";
import {
  createDriveCurve,
  forceBackgroundMutationProfile,
  type LiveMutationState,
} from "./liveLogMonitorAudioRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import {
  buildBackgroundMutationAutomationPlan,
  resolveLiveBackgroundMutation,
} from "./liveLogMonitorMutationRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import { applyBackgroundMutationAutomationPlan } from "./liveLogMonitorBackgroundMutationApplyRuntime";
import {
  applyResolvedBackgroundMutation,
  resolveBackgroundMutationTargets,
  shouldApplyForcedBackgroundMutation,
} from "./liveLogMonitorBackgroundMutationEffectRuntime";

interface UseLiveLogMonitorBackgroundMutationInput {
  audioContextRef: MutableRefObject<AudioContext | null>;
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
}

export function useLiveLogMonitorBackgroundMutation(
  input: UseLiveLogMonitorBackgroundMutationInput,
) {
  const applyBackgroundMutation = useEffectEvent(
    (mutation: ReturnType<typeof forceBackgroundMutationProfile>, nextState: LiveMutationState) => {
      applyResolvedBackgroundMutation({
        targets: resolveBackgroundMutationTargets({
          audioContextRef: input.audioContextRef,
          backgroundGainRef: input.backgroundGainRef,
          backgroundDryGainRef: input.backgroundDryGainRef,
          backgroundDriveWetGainRef: input.backgroundDriveWetGainRef,
          backgroundDriveNodeRef: input.backgroundDriveNodeRef,
          filterNodeRef: input.filterNodeRef,
          backgroundDeckRef: input.backgroundDeckRef,
        }),
        mutation,
        nextState,
        setLiveMutationState: input.setLiveMutationState,
        styleProfile: {
          backgroundGain: input.selectedStyleProfile.backgroundGain,
          filterCeilingHz: input.selectedStyleProfile.filterCeilingHz,
        },
        buildAutomationPlan: buildBackgroundMutationAutomationPlan,
        applyAutomationPlan: applyBackgroundMutationAutomationPlan,
        createDriveCurve,
      });
    },
  );

  const applyLogModulation = useEffectEvent((update: LiveLogStreamUpdate) => {
    const { mutation, nextState } = resolveLiveBackgroundMutation({
      update,
      styleProfile: input.selectedStyleProfile,
      mutationProfile: input.selectedMutationProfile,
      forcedLiveMutationState: input.forcedLiveMutationState,
    });
    applyBackgroundMutation(mutation, nextState);
  });

  useEffect(() => {
    if (
      !shouldApplyForcedBackgroundMutation({
        liveEnabled: input.liveEnabled,
        hasBackgroundDeck: Boolean(input.backgroundDeckRef.current),
        forcedLiveMutationState: input.forcedLiveMutationState,
      })
    ) {
      return;
    }

    if (input.forcedLiveMutationState === "auto") {
      return;
    }

    const mutation = forceBackgroundMutationProfile(
      input.forcedLiveMutationState,
      input.selectedStyleProfile,
    );
    applyBackgroundMutation(mutation, input.forcedLiveMutationState);
  }, [
    applyBackgroundMutation,
    input.backgroundDeckRef,
    input.forcedLiveMutationState,
    input.liveEnabled,
    input.selectedStyleProfile,
  ]);

  return { applyLogModulation };
}
