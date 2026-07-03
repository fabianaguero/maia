import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type {
  BackgroundMutationAutomationPlan,
  LiveBackgroundMutationResolution,
} from "./liveLogMonitorMutationRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import { createDriveCurve } from "./liveLogMonitorAudioRuntime";

interface BackgroundMutationTargets {
  context: AudioContext;
  filter: BiquadFilterNode;
  backgroundGain: GainNode;
  dryGain: GainNode;
  driveWetGain: GainNode;
  driveNode: WaveShaperNode;
  activeDeck: BackgroundDeckState;
}

export function resolveBackgroundMutationTargets(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  backgroundGainRef: MutableRefObject<GainNode | null>;
  backgroundDryGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveWetGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveNodeRef: MutableRefObject<WaveShaperNode | null>;
  filterNodeRef: MutableRefObject<BiquadFilterNode | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
}): BackgroundMutationTargets | null {
  const context = input.audioContextRef.current;
  const filter = input.filterNodeRef.current;
  const backgroundGain = input.backgroundGainRef.current;
  const dryGain = input.backgroundDryGainRef.current;
  const driveWetGain = input.backgroundDriveWetGainRef.current;
  const driveNode = input.backgroundDriveNodeRef.current;
  const activeDeck = input.backgroundDeckRef.current;

  if (
    !context ||
    !filter ||
    !backgroundGain ||
    !dryGain ||
    !driveWetGain ||
    !driveNode ||
    !activeDeck
  ) {
    return null;
  }

  return {
    context,
    filter,
    backgroundGain,
    dryGain,
    driveWetGain,
    driveNode,
    activeDeck,
  };
}

export function applyResolvedBackgroundMutation(input: {
  targets: BackgroundMutationTargets | null;
  mutation: LiveBackgroundMutationResolution["mutation"];
  nextState: LiveMutationState;
  setLiveMutationState: Dispatch<SetStateAction<LiveMutationState>>;
  styleProfile: {
    backgroundGain: number;
    filterCeilingHz: number;
  };
  buildAutomationPlan: (input: {
    now: number;
    mutation: LiveBackgroundMutationResolution["mutation"];
    styleProfile: {
      backgroundGain: number;
      filterCeilingHz: number;
    };
    currentValues: {
      filterHz: number;
      filterQ: number;
      backgroundGain: number;
      dryGain: number;
      wetGain: number;
      playbackRate: number;
      deckGain: number;
    };
  }) => BackgroundMutationAutomationPlan;
  applyAutomationPlan: (input: {
    now: number;
    filter: BiquadFilterNode;
    backgroundGain: GainNode;
    dryGain: GainNode;
    driveWetGain: GainNode;
    driveNode: WaveShaperNode;
    activeDeck: BackgroundDeckState;
    automationPlan: BackgroundMutationAutomationPlan;
    createDriveCurve: typeof createDriveCurve;
  }) => void;
  createDriveCurve: typeof createDriveCurve;
}): boolean {
  if (!input.targets) {
    return false;
  }

  input.setLiveMutationState(input.nextState);
  const now = input.targets.context.currentTime;
  const automationPlan = input.buildAutomationPlan({
    now,
    mutation: input.mutation,
    styleProfile: input.styleProfile,
    currentValues: {
      filterHz: input.targets.filter.frequency.value,
      filterQ: input.targets.filter.Q.value,
      backgroundGain: input.targets.backgroundGain.gain.value,
      dryGain: input.targets.dryGain.gain.value,
      wetGain: input.targets.driveWetGain.gain.value,
      playbackRate: input.targets.activeDeck.source.playbackRate.value,
      deckGain: input.targets.activeDeck.gain.gain.value,
    },
  });

  input.applyAutomationPlan({
    now,
    filter: input.targets.filter,
    backgroundGain: input.targets.backgroundGain,
    dryGain: input.targets.dryGain,
    driveWetGain: input.targets.driveWetGain,
    driveNode: input.targets.driveNode,
    activeDeck: input.targets.activeDeck,
    automationPlan,
    createDriveCurve: input.createDriveCurve,
  });
  return true;
}

export function shouldApplyForcedBackgroundMutation(input: {
  liveEnabled: boolean;
  hasBackgroundDeck: boolean;
  forcedLiveMutationState: ForcedLiveMutationState;
}): boolean {
  return input.liveEnabled && input.hasBackgroundDeck && input.forcedLiveMutationState !== "auto";
}
