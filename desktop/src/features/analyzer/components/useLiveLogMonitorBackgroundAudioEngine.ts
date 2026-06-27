import { useEffect, useEffectEvent, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

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
  const ensureBackgroundBus = useEffectEvent((context: AudioContext) => {
    let createdFilter = false;
    let createdGain = false;
    let createdDryGain = false;
    let createdDriveWetGain = false;
    let createdDrive = false;

    if (!input.filterNodeRef.current) {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(input.selectedStyleProfile.filterCeilingHz, context.currentTime);
      input.filterNodeRef.current = filter;
      createdFilter = true;
    }

    if (!input.backgroundDryGainRef.current) {
      const dryGain = context.createGain();
      dryGain.gain.setValueAtTime(1, context.currentTime);
      input.backgroundDryGainRef.current = dryGain;
      createdDryGain = true;
    }

    if (!input.backgroundDriveWetGainRef.current) {
      const wetGain = context.createGain();
      wetGain.gain.setValueAtTime(0.0001, context.currentTime);
      input.backgroundDriveWetGainRef.current = wetGain;
      createdDriveWetGain = true;
    }

    if (!input.backgroundDriveNodeRef.current) {
      const drive = context.createWaveShaper();
      drive.curve = createDriveCurve(1.35);
      drive.oversample = "4x";
      input.backgroundDriveNodeRef.current = drive;
      createdDrive = true;
    }

    if (!input.backgroundGainRef.current) {
      const backgroundGain = context.createGain();
      backgroundGain.gain.setValueAtTime(
        input.selectedStyleProfile.backgroundGain,
        context.currentTime,
      );
      backgroundGain.connect(input.masterGainRef.current ?? context.destination);
      input.backgroundGainRef.current = backgroundGain;
      createdGain = true;
    }

    if (
      (createdFilter || createdDryGain || createdDriveWetGain || createdDrive || createdGain) &&
      input.filterNodeRef.current &&
      input.backgroundDryGainRef.current &&
      input.backgroundDriveNodeRef.current &&
      input.backgroundDriveWetGainRef.current &&
      input.backgroundGainRef.current
    ) {
      input.filterNodeRef.current.connect(input.backgroundDryGainRef.current);
      input.backgroundDryGainRef.current.connect(input.backgroundGainRef.current);
      input.filterNodeRef.current.connect(input.backgroundDriveNodeRef.current);
      input.backgroundDriveNodeRef.current.connect(input.backgroundDriveWetGainRef.current);
      input.backgroundDriveWetGainRef.current.connect(input.backgroundGainRef.current);
    }
  });

  const applyBackgroundMutation = useEffectEvent(
    (mutation: ReturnType<typeof forceBackgroundMutationProfile>, nextState: LiveMutationState) => {
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
        return;
      }

      input.setLiveMutationState(nextState);
      const now = context.currentTime;
      const automationPlan = buildBackgroundMutationAutomationPlan({
        now,
        mutation,
        styleProfile: {
          backgroundGain: input.selectedStyleProfile.backgroundGain,
          filterCeilingHz: input.selectedStyleProfile.filterCeilingHz,
        },
        currentValues: {
          filterHz: filter.frequency.value,
          filterQ: filter.Q.value,
          backgroundGain: backgroundGain.gain.value,
          dryGain: dryGain.gain.value,
          wetGain: driveWetGain.gain.value,
          playbackRate: activeDeck.source.playbackRate.value,
          deckGain: activeDeck.gain.gain.value,
        },
      });

      filter.frequency.cancelScheduledValues(now);
      filter.Q.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(automationPlan.filter.startHz, now);
      filter.Q.setValueAtTime(automationPlan.filter.startQ, now);
      filter.frequency.exponentialRampToValueAtTime(automationPlan.filter.targetHz, now + 0.06);
      filter.frequency.exponentialRampToValueAtTime(
        automationPlan.filter.recoverHz,
        automationPlan.recoverAt,
      );
      filter.Q.linearRampToValueAtTime(automationPlan.filter.targetQ, now + 0.05);
      filter.Q.linearRampToValueAtTime(automationPlan.filter.recoverQ, automationPlan.recoverAt);

      backgroundGain.gain.cancelScheduledValues(now);
      backgroundGain.gain.setValueAtTime(automationPlan.busGain.start, now);
      backgroundGain.gain.linearRampToValueAtTime(automationPlan.busGain.target, now + 0.04);
      backgroundGain.gain.linearRampToValueAtTime(
        automationPlan.busGain.recover,
        automationPlan.recoverAt,
      );

      dryGain.gain.cancelScheduledValues(now);
      driveWetGain.gain.cancelScheduledValues(now);
      dryGain.gain.setValueAtTime(automationPlan.dryGain.start, now);
      driveWetGain.gain.setValueAtTime(automationPlan.wetGain.start, now);
      dryGain.gain.linearRampToValueAtTime(automationPlan.dryGain.target, now + 0.04);
      driveWetGain.gain.linearRampToValueAtTime(automationPlan.wetGain.target, now + 0.04);
      dryGain.gain.linearRampToValueAtTime(automationPlan.dryGain.recover, automationPlan.recoverAt);
      driveWetGain.gain.linearRampToValueAtTime(
        automationPlan.wetGain.recover,
        automationPlan.recoverAt,
      );
      driveNode.curve = createDriveCurve(automationPlan.driveCurveAmount);

      activeDeck.source.playbackRate.cancelScheduledValues(now);
      activeDeck.source.playbackRate.setValueAtTime(automationPlan.deckPlaybackRate.start, now);
      activeDeck.source.playbackRate.linearRampToValueAtTime(
        automationPlan.deckPlaybackRate.target,
        now + 0.05,
      );
      activeDeck.source.playbackRate.linearRampToValueAtTime(
        automationPlan.deckPlaybackRate.recover,
        automationPlan.recoverAt,
      );

      activeDeck.gain.gain.cancelScheduledValues(now);
      activeDeck.gain.gain.setValueAtTime(automationPlan.deckGain.start, now);
      activeDeck.gain.gain.linearRampToValueAtTime(automationPlan.deckGain.target, now + 0.03);

      automationPlan.gatePulses.forEach((pulse) => {
        activeDeck.gain.gain.linearRampToValueAtTime(pulse.gateFloor, pulse.at);
        activeDeck.gain.gain.linearRampToValueAtTime(
          automationPlan.deckGain.target,
          pulse.recoverAt,
        );
      });

      activeDeck.gain.gain.linearRampToValueAtTime(
        automationPlan.deckGain.recover,
        automationPlan.recoverAt,
      );
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
      !input.liveEnabled ||
      !input.backgroundDeckRef.current ||
      input.forcedLiveMutationState === "auto"
    ) {
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

  return { ensureBackgroundBus, applyLogModulation };
}
