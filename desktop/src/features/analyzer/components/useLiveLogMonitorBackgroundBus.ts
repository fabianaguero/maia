import { useEffectEvent, type MutableRefObject } from "react";

import { createDriveCurve } from "./liveLogMonitorAudioRuntime";

interface UseLiveLogMonitorBackgroundBusInput {
  masterGainRef: MutableRefObject<GainNode | null>;
  backgroundGainRef: MutableRefObject<GainNode | null>;
  backgroundDryGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveWetGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveNodeRef: MutableRefObject<WaveShaperNode | null>;
  filterNodeRef: MutableRefObject<BiquadFilterNode | null>;
  selectedStyleProfile: {
    backgroundGain: number;
    filterCeilingHz: number;
  };
}

export function useLiveLogMonitorBackgroundBus(input: UseLiveLogMonitorBackgroundBusInput) {
  return useEffectEvent((context: AudioContext) => {
    let createdFilter = false;
    let createdGain = false;
    let createdDryGain = false;
    let createdDriveWetGain = false;
    let createdDrive = false;

    if (!input.filterNodeRef.current) {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(
        input.selectedStyleProfile.filterCeilingHz,
        context.currentTime,
      );
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
}
