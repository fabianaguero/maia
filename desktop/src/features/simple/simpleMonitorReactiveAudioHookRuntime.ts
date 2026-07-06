import type { MonitorCueBatch } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import {
  buildMonitorTrackMutationPlan,
  type MonitorTrackMutationInput,
} from "./monitorAudioMutation";
import { buildAdjustedMonitorTrackMutationPlan } from "./monitorTrackMutationRuntime";
import {
  applySimpleMonitorTrackMutationState,
  ensureSimpleMonitorBackgroundGraphState,
} from "./simpleMonitorReactiveAudioControllerRuntime";
import {
  buildSimpleMonitorCueBatchPlan,
  buildSimpleMonitorTestTonePlan,
  hasRunningSimpleMonitorAudioContext,
  type SimpleMonitorToneVoicePlan,
} from "./simpleMonitorReactiveAudioOrchestrationRuntime";
import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioRuntime";

export interface SimpleMonitorReactiveAudioPlaybackState {
  context: AudioContext;
  voicePlans: SimpleMonitorToneVoicePlan[];
}

export function buildSimpleMonitorTestTonePlaybackState(input: {
  audioContext: AudioContext | null | undefined;
  masterVolume: number;
}): SimpleMonitorReactiveAudioPlaybackState | null {
  if (!hasRunningSimpleMonitorAudioContext(input.audioContext)) {
    return null;
  }

  return {
    context: input.audioContext,
    voicePlans: buildSimpleMonitorTestTonePlan({
      masterVolume: input.masterVolume,
      now: input.audioContext.currentTime,
    }),
  };
}

export function buildSimpleMonitorCueBatchPlaybackState(input: {
  audioContext: AudioContext | null | undefined;
  cues: MonitorCueBatch;
  masterVolume: number;
  hasBackgroundGraph: boolean;
}): SimpleMonitorReactiveAudioPlaybackState | null {
  if (!hasRunningSimpleMonitorAudioContext(input.audioContext)) {
    return null;
  }

  return {
    context: input.audioContext,
    voicePlans: buildSimpleMonitorCueBatchPlan({
      cues: input.cues,
      masterVolume: input.masterVolume,
      hasBackgroundGraph: input.hasBackgroundGraph,
      now: input.audioContext.currentTime,
    }),
  };
}

export function resolveSimpleMonitorBackgroundGraphState(input: {
  existing: BackgroundTrackGraph | null;
  context: AudioContext;
  audio: HTMLAudioElement;
  masterVolume: number;
  warn: (message: string, error: unknown) => void;
}): BackgroundTrackGraph | null {
  return ensureSimpleMonitorBackgroundGraphState({
    existing: input.existing,
    context: input.context,
    audio: input.audio,
    masterVolume: input.masterVolume,
    logger: {
      warn: input.warn,
    },
  });
}

export function applySimpleMonitorTrackMutationRefState(input: {
  update: MonitorTrackMutationInput;
  graph: BackgroundTrackGraph | null;
  backgroundAudio: HTMLAudioElement | null;
  currentPressure: number;
  controls: MonitorDeckControls;
  applyMonitorReactiveAudioPlan: (input: {
    graph: BackgroundTrackGraph;
    adjustedPlan: ReturnType<typeof buildMonitorTrackMutationPlan>;
    masterVolume: number;
    audio: HTMLAudioElement;
  }) => void;
}): { nextPressure: number } {
  return applySimpleMonitorTrackMutationState({
    update: input.update,
    graph: input.graph,
    audio: input.backgroundAudio,
    currentPressure: input.currentPressure,
    controls: input.controls,
    buildMonitorTrackMutationPlan,
    buildAdjustedMonitorTrackMutationPlan,
    applyMonitorReactiveAudioPlan: input.applyMonitorReactiveAudioPlan,
  });
}
