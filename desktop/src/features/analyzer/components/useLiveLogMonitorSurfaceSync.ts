import { useEffect, type MutableRefObject } from "react";

import type { BaseTrackPlaylist } from "../../../types/library";
import { saveMonitorPrefs } from "../../../utils/monitorPrefs";
import { buildLiveMonitorPrefsState } from "./liveLogMonitorPreferencesRuntime";
import type { ManagedBlobAudioElement } from "./liveLogMonitorAudioRuntime";
import { setBlobAudioVolumeState } from "./liveLogMonitorAudioRuntime";

export function useLiveLogMonitorSurfaceSync(input: {
  repositoryId: string;
  basePlaylist: BaseTrackPlaylist | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  masterVolume: number;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  masterGainRef: MutableRefObject<GainNode | null>;
  syncTailListRef: MutableRefObject<HTMLDivElement | null>;
  syncTailRowCount: number;
  previousAudibleVolumeRef: MutableRefObject<number>;
  backgroundGainRef: MutableRefObject<GainNode | null>;
  backgroundDryGainRef: MutableRefObject<GainNode | null>;
  backgroundDriveWetGainRef: MutableRefObject<GainNode | null>;
  filterNodeRef: MutableRefObject<BiquadFilterNode | null>;
  selectedStyleProfile: {
    backgroundGain: number;
    filterCeilingHz: number;
  };
}): void {
  useEffect(() => {
    saveMonitorPrefs(
      input.repositoryId,
      buildLiveMonitorPrefsState({
        basePlaylist: input.basePlaylist,
        selectedStyleProfileId: input.selectedStyleProfileId,
        selectedMutationProfileId: input.selectedMutationProfileId,
        masterVolume: input.masterVolume,
      }),
    );
  }, [
    input.repositoryId,
    input.basePlaylist,
    input.selectedStyleProfileId,
    input.selectedMutationProfileId,
    input.masterVolume,
  ]);

  useEffect(() => {
    if (input.masterGainRef.current) {
      input.masterGainRef.current.gain.setValueAtTime(
        input.masterVolume,
        input.audioContextRef.current?.currentTime ?? 0,
      );
    }
    setBlobAudioVolumeState(input.activeBlobAudioElements, input.masterVolume);
  }, [
    input.activeBlobAudioElements,
    input.audioContextRef,
    input.masterGainRef,
    input.masterVolume,
  ]);

  useEffect(() => {
    const element = input.syncTailListRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [input.syncTailListRef, input.syncTailRowCount]);

  useEffect(() => {
    if (input.masterVolume > 0.001) {
      input.previousAudibleVolumeRef.current = input.masterVolume;
    }
  }, [input.masterVolume, input.previousAudibleVolumeRef]);

  useEffect(() => {
    const context = input.audioContextRef.current;
    if (!context) {
      return;
    }

    if (input.backgroundGainRef.current) {
      input.backgroundGainRef.current.gain.setValueAtTime(
        input.selectedStyleProfile.backgroundGain,
        context.currentTime,
      );
    }

    if (input.backgroundDryGainRef.current) {
      input.backgroundDryGainRef.current.gain.setValueAtTime(1, context.currentTime);
    }

    if (input.backgroundDriveWetGainRef.current) {
      input.backgroundDriveWetGainRef.current.gain.setValueAtTime(0.0001, context.currentTime);
    }

    if (input.filterNodeRef.current) {
      input.filterNodeRef.current.frequency.setValueAtTime(
        input.selectedStyleProfile.filterCeilingHz,
        context.currentTime,
      );
    }
  }, [
    input.audioContextRef,
    input.backgroundGainRef,
    input.backgroundDryGainRef,
    input.backgroundDriveWetGainRef,
    input.filterNodeRef,
    input.selectedStyleProfile.backgroundGain,
    input.selectedStyleProfile.filterCeilingHz,
  ]);
}
