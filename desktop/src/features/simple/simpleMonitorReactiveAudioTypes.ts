import type { MutableRefObject } from "react";

import type { MonitorCueBatchPlayer } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorTrackMutationInput } from "./monitorAudioMutation";

export interface BackgroundTrackGraph {
  context: AudioContext;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  filter: BiquadFilterNode;
  dryGain: GainNode;
  driveNode: WaveShaperNode;
  driveWetGain: GainNode;
  outputGain: GainNode;
  deckGain: GainNode;
}

export type SimpleMonitorTrackMutationUpdate = MonitorTrackMutationInput;

export interface SimpleMonitorReactiveAudioHookState {
  backgroundGraphRef: MutableRefObject<BackgroundTrackGraph | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  deckControlsRef: MutableRefObject<MonitorDeckControls>;
  ensureBackgroundGraph: (
    audio: HTMLAudioElement,
    context: AudioContext,
  ) => BackgroundTrackGraph | null;
  applyTrackMutation: (
    update: SimpleMonitorTrackMutationUpdate,
    backgroundAudioRef: { current: HTMLAudioElement | null },
  ) => void;
  playTestTone: () => void;
  playCueBatch: MonitorCueBatchPlayer;
}
