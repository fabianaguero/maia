import type { buildBackgroundMutationAutomationPlan } from "./liveLogMonitorMutationRuntime";

interface AudioParamLike {
  value: number;
  cancelScheduledValues: (time: number) => void;
  setValueAtTime: (value: number, time: number) => void;
  linearRampToValueAtTime: (value: number, time: number) => void;
  exponentialRampToValueAtTime: (value: number, time: number) => void;
}

interface BackgroundMutationFilterLike {
  frequency: AudioParamLike;
  Q: AudioParamLike;
}

interface BackgroundMutationGainLike {
  gain: AudioParamLike;
}

interface BackgroundMutationDriveLike {
  curve: Float32Array<ArrayBuffer> | null;
}

interface BackgroundMutationDeckLike {
  source: {
    playbackRate: AudioParamLike;
  };
  gain: {
    gain: AudioParamLike;
  };
}

export function applyBackgroundMutationAutomationPlan(input: {
  now: number;
  filter: BackgroundMutationFilterLike;
  backgroundGain: BackgroundMutationGainLike;
  dryGain: BackgroundMutationGainLike;
  driveWetGain: BackgroundMutationGainLike;
  driveNode: BackgroundMutationDriveLike;
  activeDeck: BackgroundMutationDeckLike;
  automationPlan: ReturnType<typeof buildBackgroundMutationAutomationPlan>;
  createDriveCurve: (amount: number) => Float32Array<ArrayBuffer>;
}): void {
  input.filter.frequency.cancelScheduledValues(input.now);
  input.filter.Q.cancelScheduledValues(input.now);
  input.filter.frequency.setValueAtTime(input.automationPlan.filter.startHz, input.now);
  input.filter.Q.setValueAtTime(input.automationPlan.filter.startQ, input.now);
  input.filter.frequency.exponentialRampToValueAtTime(
    input.automationPlan.filter.targetHz,
    input.now + 0.06,
  );
  input.filter.frequency.exponentialRampToValueAtTime(
    input.automationPlan.filter.recoverHz,
    input.automationPlan.recoverAt,
  );
  input.filter.Q.linearRampToValueAtTime(input.automationPlan.filter.targetQ, input.now + 0.05);
  input.filter.Q.linearRampToValueAtTime(
    input.automationPlan.filter.recoverQ,
    input.automationPlan.recoverAt,
  );

  input.backgroundGain.gain.cancelScheduledValues(input.now);
  input.backgroundGain.gain.setValueAtTime(input.automationPlan.busGain.start, input.now);
  input.backgroundGain.gain.linearRampToValueAtTime(
    input.automationPlan.busGain.target,
    input.now + 0.04,
  );
  input.backgroundGain.gain.linearRampToValueAtTime(
    input.automationPlan.busGain.recover,
    input.automationPlan.recoverAt,
  );

  input.dryGain.gain.cancelScheduledValues(input.now);
  input.driveWetGain.gain.cancelScheduledValues(input.now);
  input.dryGain.gain.setValueAtTime(input.automationPlan.dryGain.start, input.now);
  input.driveWetGain.gain.setValueAtTime(input.automationPlan.wetGain.start, input.now);
  input.dryGain.gain.linearRampToValueAtTime(input.automationPlan.dryGain.target, input.now + 0.04);
  input.driveWetGain.gain.linearRampToValueAtTime(
    input.automationPlan.wetGain.target,
    input.now + 0.04,
  );
  input.dryGain.gain.linearRampToValueAtTime(
    input.automationPlan.dryGain.recover,
    input.automationPlan.recoverAt,
  );
  input.driveWetGain.gain.linearRampToValueAtTime(
    input.automationPlan.wetGain.recover,
    input.automationPlan.recoverAt,
  );
  input.driveNode.curve = input.createDriveCurve(input.automationPlan.driveCurveAmount);

  input.activeDeck.source.playbackRate.cancelScheduledValues(input.now);
  input.activeDeck.source.playbackRate.setValueAtTime(
    input.automationPlan.deckPlaybackRate.start,
    input.now,
  );
  input.activeDeck.source.playbackRate.linearRampToValueAtTime(
    input.automationPlan.deckPlaybackRate.target,
    input.now + 0.05,
  );
  input.activeDeck.source.playbackRate.linearRampToValueAtTime(
    input.automationPlan.deckPlaybackRate.recover,
    input.automationPlan.recoverAt,
  );

  input.activeDeck.gain.gain.cancelScheduledValues(input.now);
  input.activeDeck.gain.gain.setValueAtTime(input.automationPlan.deckGain.start, input.now);
  input.activeDeck.gain.gain.linearRampToValueAtTime(
    input.automationPlan.deckGain.target,
    input.now + 0.03,
  );

  input.automationPlan.gatePulses.forEach((pulse) => {
    input.activeDeck.gain.gain.linearRampToValueAtTime(pulse.gateFloor, pulse.at);
    input.activeDeck.gain.gain.linearRampToValueAtTime(
      input.automationPlan.deckGain.target,
      pulse.recoverAt,
    );
  });

  input.activeDeck.gain.gain.linearRampToValueAtTime(
    input.automationPlan.deckGain.recover,
    input.automationPlan.recoverAt,
  );
}
