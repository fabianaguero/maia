import { createDriveCurve } from "./monitorTrackMutationRuntime";
import type { MonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioTypes";

export function applyAlertMonitorReactiveAudioPlan(input: {
  graph: BackgroundTrackGraph;
  adjustedPlan: MonitorTrackMutationPlan;
  masterVolume: number;
  audio: HTMLAudioElement;
  now: number;
}): void {
  const { graph, adjustedPlan, masterVolume, audio, now } = input;
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
