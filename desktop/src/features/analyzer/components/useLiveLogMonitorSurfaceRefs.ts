import { useRef } from "react";

import type { BeatClock, BeatLooperState } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { RoutedLiveCue } from "./liveSonificationScene";

export function useLiveLogMonitorSurfaceRefs(initialMasterVolume: number) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const usingSharedAudioContextRef = useRef(false);
  const masterGainRef = useRef<GainNode | null>(null);
  const backgroundGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const backgroundDryGainRef = useRef<GainNode | null>(null);
  const backgroundDriveWetGainRef = useRef<GainNode | null>(null);
  const backgroundDriveNodeRef = useRef<WaveShaperNode | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const beatClockRef = useRef<BeatClock | null>(null);
  const beatLooperRef = useRef<BeatLooperState | null>(null);
  const backgroundDeckRef = useRef<BackgroundDeckState | null>(null);
  const panelAudioProbePlayedRef = useRef(false);
  const backgroundTransitionTimerRef = useRef<number | null>(null);
  const backgroundBufferCacheRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const bounceCuesRef = useRef<RoutedLiveCue[][]>([]);
  const knownComponentsRef = useRef<string[]>([]);
  const syncTailListRef = useRef<HTMLDivElement | null>(null);
  const previousAudibleVolumeRef = useRef(initialMasterVolume > 0 ? initialMasterVolume : 0.45);

  return {
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    backgroundGainRef,
    analyserRef,
    backgroundDryGainRef,
    backgroundDriveWetGainRef,
    backgroundDriveNodeRef,
    sampleBuffersRef,
    beatClockRef,
    beatLooperRef,
    backgroundDeckRef,
    panelAudioProbePlayedRef,
    backgroundTransitionTimerRef,
    backgroundBufferCacheRef,
    filterNodeRef,
    bounceCuesRef,
    knownComponentsRef,
    syncTailListRef,
    previousAudibleVolumeRef,
  };
}
