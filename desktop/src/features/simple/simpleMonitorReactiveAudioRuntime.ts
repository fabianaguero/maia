import type { MutableRefObject } from "react";

import type { LiveLogMarker } from "../../types/monitor";
import type { MonitorTrackMutationPlan } from "./monitorAudioMutation";
import { createDriveCurve } from "./monitorTrackMutationRuntime";
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

export interface SimpleMonitorReactiveAudioHookState {
  backgroundGraphRef: MutableRefObject<BackgroundTrackGraph | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  deckControlsRef: MutableRefObject<MonitorDeckControls>;
  ensureBackgroundGraph: (
    audio: HTMLAudioElement,
    context: AudioContext,
  ) => BackgroundTrackGraph | null;
  applyTrackMutation: (
    update: {
      lineCount?: number;
      anomalyCount?: number;
      levelCounts?: Record<string, number>;
      anomalyMarkers?: LiveLogMarker[];
    },
    backgroundAudioRef: { current: HTMLAudioElement | null },
  ) => void;
  playTestTone: () => void;
  playCueBatch: (
    cues: Array<{
      noteHz?: number;
      gain?: number;
      durationMs?: number;
      waveform?: OscillatorType;
      accent?: string;
    }>,
  ) => void;
}

export function applyMonitorReactiveAudioPlan(input: {
  graph: BackgroundTrackGraph;
  adjustedPlan: MonitorTrackMutationPlan;
  masterVolume: number;
  audio: HTMLAudioElement;
}): void {
  const { graph, adjustedPlan, masterVolume, audio } = input;
  const now = graph.context.currentTime;

  if (adjustedPlan.mode === "neutral") {
    graph.filter.frequency.cancelScheduledValues(now);
    graph.filter.frequency.setValueAtTime(graph.filter.frequency.value, now);
    graph.filter.frequency.exponentialRampToValueAtTime(
      adjustedPlan.filterHz,
      now + adjustedPlan.recoverAtOffsetSec,
    );

    graph.filter.Q.cancelScheduledValues(now);
    graph.filter.Q.setValueAtTime(graph.filter.Q.value, now);
    graph.filter.Q.linearRampToValueAtTime(
      adjustedPlan.filterQ,
      now + adjustedPlan.recoverAtOffsetSec,
    );

    graph.outputGain.gain.cancelScheduledValues(now);
    graph.outputGain.gain.setValueAtTime(graph.outputGain.gain.value, now);
    graph.outputGain.gain.linearRampToValueAtTime(
      adjustedPlan.outputGain,
      now + adjustedPlan.transitionSec,
    );

    graph.dryGain.gain.cancelScheduledValues(now);
    graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
    graph.dryGain.gain.linearRampToValueAtTime(
      adjustedPlan.dryGain,
      now + adjustedPlan.transitionSec,
    );

    graph.driveWetGain.gain.cancelScheduledValues(now);
    graph.driveWetGain.gain.setValueAtTime(graph.driveWetGain.gain.value, now);
    graph.driveWetGain.gain.linearRampToValueAtTime(
      adjustedPlan.driveWet,
      now + adjustedPlan.transitionSec,
    );

    graph.deckGain.gain.cancelScheduledValues(now);
    graph.deckGain.gain.setValueAtTime(graph.deckGain.gain.value, now);
    graph.deckGain.gain.linearRampToValueAtTime(
      adjustedPlan.deckGain,
      now + adjustedPlan.transitionSec,
    );

    graph.driveNode.curve = createDriveCurve(adjustedPlan.driveCurveAmount);
    audio.playbackRate = adjustedPlan.playbackRate;
    return;
  }

  const recoverAt = now + adjustedPlan.recoverAtOffsetSec;

  graph.filter.frequency.cancelScheduledValues(now);
  graph.filter.frequency.setValueAtTime(graph.filter.frequency.value, now);
  graph.filter.frequency.exponentialRampToValueAtTime(
    adjustedPlan.filterHz,
    now + (adjustedPlan.sustainedBurst ? 0.5 : 0.32),
  );
  graph.filter.frequency.exponentialRampToValueAtTime(18000, recoverAt);

  graph.filter.Q.cancelScheduledValues(now);
  graph.filter.Q.setValueAtTime(graph.filter.Q.value, now);
  graph.filter.Q.linearRampToValueAtTime(
    adjustedPlan.filterQ,
    now + (adjustedPlan.sustainedBurst ? 0.42 : 0.28),
  );
  graph.filter.Q.linearRampToValueAtTime(1, recoverAt);

  graph.outputGain.gain.cancelScheduledValues(now);
  graph.outputGain.gain.setValueAtTime(graph.outputGain.gain.value, now);
  graph.outputGain.gain.linearRampToValueAtTime(
    adjustedPlan.outputGain,
    now + (adjustedPlan.sustainedBurst ? 0.38 : 0.26),
  );
  graph.outputGain.gain.linearRampToValueAtTime(masterVolume, recoverAt);

  graph.dryGain.gain.cancelScheduledValues(now);
  graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
  graph.dryGain.gain.linearRampToValueAtTime(
    adjustedPlan.dryGain,
    now + (adjustedPlan.sustainedBurst ? 0.38 : 0.26),
  );
  graph.dryGain.gain.linearRampToValueAtTime(1, recoverAt);

  graph.driveWetGain.gain.cancelScheduledValues(now);
  graph.driveWetGain.gain.setValueAtTime(graph.driveWetGain.gain.value, now);
  graph.driveWetGain.gain.linearRampToValueAtTime(
    adjustedPlan.driveWet,
    now + (adjustedPlan.sustainedBurst ? 0.34 : 0.24),
  );
  graph.driveWetGain.gain.linearRampToValueAtTime(0.0001, recoverAt);

  graph.driveNode.curve = createDriveCurve(adjustedPlan.driveCurveAmount);

  graph.deckGain.gain.cancelScheduledValues(now);
  graph.deckGain.gain.setValueAtTime(graph.deckGain.gain.value, now);
  graph.deckGain.gain.linearRampToValueAtTime(
    adjustedPlan.deckGain,
    now + (adjustedPlan.sustainedBurst ? 0.34 : 0.22),
  );
  graph.deckGain.gain.linearRampToValueAtTime(1, recoverAt);

  if (adjustedPlan.gateFloor !== null) {
    const pulseAt = now + 0.22;
    graph.deckGain.gain.linearRampToValueAtTime(adjustedPlan.gateFloor, pulseAt + 0.08);
    graph.deckGain.gain.linearRampToValueAtTime(adjustedPlan.deckGain, pulseAt + 0.34);
  }

  audio.playbackRate = adjustedPlan.playbackRate;
}

export function buildSimpleMonitorReactiveAudioHookState(
  input: SimpleMonitorReactiveAudioHookState,
): SimpleMonitorReactiveAudioHookState {
  return {
    backgroundGraphRef: input.backgroundGraphRef,
    audioContextRef: input.audioContextRef,
    deckControlsRef: input.deckControlsRef,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    applyTrackMutation: input.applyTrackMutation,
    playTestTone: input.playTestTone,
    playCueBatch: input.playCueBatch,
  };
}
