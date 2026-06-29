import type { LiveLogStreamUpdate } from "../../../types/library";
import type { StyleProfileOption, MutationProfileOption } from "../../../types/music";
import {
  forceBackgroundMutationProfile,
  resolveBackgroundMutationProfile,
  resolveLiveMutationState,
  type BackgroundMutationProfile,
  type LiveMutationState,
} from "./liveLogMonitorAudioRuntime";

export interface LiveBackgroundMutationResolution {
  computedMutation: BackgroundMutationProfile;
  mutation: BackgroundMutationProfile;
  nextState: LiveMutationState;
}

export function resolveLiveBackgroundMutation(input: {
  update: LiveLogStreamUpdate;
  styleProfile: Pick<StyleProfileOption, "backgroundGain" | "filterBaseHz" | "filterCeilingHz">;
  mutationProfile: Pick<
    MutationProfileOption,
    "backgroundDucking" | "filterSweepMultiplier" | "anomalyBoostMultiplier" | "transitionTightness"
  >;
  forcedLiveMutationState: "auto" | LiveMutationState;
}): LiveBackgroundMutationResolution {
  const computedMutation = resolveBackgroundMutationProfile(
    input.update,
    input.styleProfile.backgroundGain,
    input.styleProfile.filterBaseHz,
    input.styleProfile.filterCeilingHz,
    input.mutationProfile,
  );

  const mutation =
    input.forcedLiveMutationState === "auto"
      ? computedMutation
      : forceBackgroundMutationProfile(input.forcedLiveMutationState, input.styleProfile);

  const nextState =
    input.forcedLiveMutationState === "auto"
      ? resolveLiveMutationState(computedMutation)
      : input.forcedLiveMutationState;

  return {
    computedMutation,
    mutation,
    nextState,
  };
}

export interface BackgroundMutationAutomationPlan {
  recoverAt: number;
  filter: {
    startHz: number;
    startQ: number;
    targetHz: number;
    targetQ: number;
    recoverHz: number;
    recoverQ: number;
  };
  busGain: {
    start: number;
    target: number;
    recover: number;
  };
  dryGain: {
    start: number;
    target: number;
    recover: number;
  };
  wetGain: {
    start: number;
    target: number;
    recover: number;
  };
  deckPlaybackRate: {
    start: number;
    target: number;
    recover: number;
  };
  deckGain: {
    start: number;
    target: number;
    recover: number;
  };
  gatePulses: Array<{
    at: number;
    gateFloor: number;
    recoverAt: number;
  }>;
  driveCurveAmount: number;
}

export function buildBackgroundMutationAutomationPlan(input: {
  now: number;
  mutation: BackgroundMutationProfile;
  styleProfile: Pick<StyleProfileOption, "backgroundGain" | "filterCeilingHz">;
  currentValues: {
    filterHz: number;
    filterQ: number;
    backgroundGain: number;
    dryGain: number;
    wetGain: number;
    playbackRate: number;
    deckGain: number;
  };
}): BackgroundMutationAutomationPlan {
  const recoverAt = input.now + input.mutation.recoverSeconds;
  const gatePulses =
    input.mutation.gatePulses > 0 && input.mutation.gateDepth > 0
      ? Array.from({ length: input.mutation.gatePulses }, (_, pulse) => {
          const at = input.now + 0.07 + pulse * 0.12;
          return {
            at,
            gateFloor: Math.max(0.06, input.mutation.deckGain * (1 - input.mutation.gateDepth)),
            recoverAt: at + 0.05,
          };
        })
      : [];

  return {
    recoverAt,
    filter: {
      startHz: Math.max(40, input.currentValues.filterHz),
      startQ: Math.max(0.001, input.currentValues.filterQ),
      targetHz: input.mutation.filterHz,
      targetQ: input.mutation.filterQ,
      recoverHz: input.styleProfile.filterCeilingHz,
      recoverQ: 1,
    },
    busGain: {
      start: Math.max(0.0001, input.currentValues.backgroundGain),
      target: input.mutation.busGain,
      recover: input.styleProfile.backgroundGain,
    },
    dryGain: {
      start: Math.max(0.0001, input.currentValues.dryGain),
      target: Math.max(0.3, 1 - input.mutation.driveWet * 0.75),
      recover: 1,
    },
    wetGain: {
      start: Math.max(0.0001, input.currentValues.wetGain),
      target: Math.max(0.0001, input.mutation.driveWet),
      recover: 0.0001,
    },
    deckPlaybackRate: {
      start: input.currentValues.playbackRate,
      target: input.mutation.playbackRate,
      recover: 1,
    },
    deckGain: {
      start: Math.max(0.0001, input.currentValues.deckGain),
      target: input.mutation.deckGain,
      recover: 1,
    },
    gatePulses,
    driveCurveAmount: 1.4 + input.mutation.driveWet * 6,
  };
}
