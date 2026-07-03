import { createDriveCurve } from "./monitorTrackMutationRuntime";
import type { MonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioTypes";

export function applyNeutralMonitorReactiveAudioPlan(input: {
  graph: BackgroundTrackGraph;
  adjustedPlan: MonitorTrackMutationPlan;
  audio: HTMLAudioElement;
  now: number;
}): void {
  const { graph, adjustedPlan, audio, now } = input;

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
}
