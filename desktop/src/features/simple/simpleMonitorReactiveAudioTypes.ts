import type { MutableRefObject } from "react";

import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorCueBatchPlayer } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";

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

export type SimpleMonitorTrackMutationUpdate = Pick<
  LiveLogStreamUpdate,
  "lineCount" | "anomalyCount" | "levelCounts" | "anomalyMarkers"
>;

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
