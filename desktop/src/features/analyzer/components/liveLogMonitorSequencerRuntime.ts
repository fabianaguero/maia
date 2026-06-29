import type { ArrangementTrack } from "./liveSonificationScene";

export interface SequencerStepFire {
  track: ArrangementTrack;
  step: number;
  humanizeOffsetMs: number;
}

export interface SequencerPlaybackPlan {
  immediate: SequencerStepFire[];
  deferred: SequencerStepFire[];
}

export function buildSequencerPlaybackPlan(
  firings: SequencerStepFire[],
  immediateThresholdMs = 4,
): SequencerPlaybackPlan {
  const immediate: SequencerStepFire[] = [];
  const deferred: SequencerStepFire[] = [];

  for (const firing of firings) {
    if (firing.humanizeOffsetMs <= immediateThresholdMs) {
      immediate.push(firing);
    } else {
      deferred.push(firing);
    }
  }

  return { immediate, deferred };
}

export function resolveSequencerPreviewVolume(masterVolume: number): number {
  return Math.min(0.18, masterVolume * 0.4);
}
