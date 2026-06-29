import type { MonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { MonitorDeckControls } from "./monitorDeckControls";

export interface MonitorAlertShapeProfile {
  filter: number;
  drive: number;
  duck: number;
  gate: number;
  recover: number;
  transition: number;
}

const NEUTRAL_FILTER_HZ = 18000;
const NEUTRAL_FILTER_Q = 1;
const NEUTRAL_DRY_GAIN = 1;
const NEUTRAL_DRIVE_WET = 0.0001;
const NEUTRAL_DECK_GAIN = 1;
const NEUTRAL_DRIVE_CURVE = 1.02;
const NEUTRAL_RECOVER_AT_SEC = 0.22;
const NEUTRAL_TRANSITION_SEC = 0.18;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function createDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = Math.max(0.1, amount);

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / (samples - 1) - 1;
    curve[index] = Math.tanh(x * drive);
  }

  return curve as Float32Array<ArrayBuffer>;
}

export function resolveMonitorAlertShapeProfile(
  alertShape: MonitorDeckControls["alertShape"],
): MonitorAlertShapeProfile {
  switch (alertShape) {
    case "soft":
      return {
        filter: 0.58,
        drive: 0.52,
        duck: 0.48,
        gate: 0.42,
        recover: 1.18,
        transition: 1.12,
      };
    case "aggressive":
      return {
        filter: 1.18,
        drive: 1.24,
        duck: 1.22,
        gate: 1.18,
        recover: 0.82,
        transition: 0.88,
      };
    default:
      return {
        filter: 1,
        drive: 1,
        duck: 1,
        gate: 1,
        recover: 1,
        transition: 1,
      };
  }
}

export function buildAdjustedMonitorTrackMutationPlan(input: {
  plan: MonitorTrackMutationPlan;
  controls: MonitorDeckControls;
}): MonitorTrackMutationPlan {
  const { plan, controls } = input;
  const alertShapeProfile = resolveMonitorAlertShapeProfile(controls.alertShape);
  const reactivityMix = controls.reactivity / 100;
  const anomalyMix = controls.anomalyEmphasis / 100;
  const duckingMix = controls.duckingIntensity / 100;
  const recoveryMix = controls.recoveryRelease / 100;
  const masterVolume = Math.max(0.04, controls.masterVolume);

  return {
    ...plan,
    filterHz:
      NEUTRAL_FILTER_HZ -
      (NEUTRAL_FILTER_HZ - plan.filterHz) * reactivityMix * alertShapeProfile.filter,
    filterQ: NEUTRAL_FILTER_Q + (plan.filterQ - NEUTRAL_FILTER_Q) * reactivityMix,
    outputGain: clamp(
      masterVolume +
        (plan.outputGain - masterVolume) *
          reactivityMix *
          (0.2 + duckingMix * 0.8) *
          alertShapeProfile.duck,
      0.04,
      1.2,
    ),
    dryGain: clamp(NEUTRAL_DRY_GAIN + (plan.dryGain - NEUTRAL_DRY_GAIN) * reactivityMix, 0, 1),
    driveWet: clamp(
      NEUTRAL_DRIVE_WET +
        (plan.driveWet - NEUTRAL_DRIVE_WET) *
          reactivityMix *
          (0.35 + anomalyMix * 0.65) *
          alertShapeProfile.drive,
      0.0001,
      1,
    ),
    deckGain: clamp(
      NEUTRAL_DECK_GAIN +
        (plan.deckGain - NEUTRAL_DECK_GAIN) *
          reactivityMix *
          (0.18 + duckingMix * 0.82) *
          alertShapeProfile.duck,
      0,
      1,
    ),
    driveCurveAmount:
      NEUTRAL_DRIVE_CURVE +
      (plan.driveCurveAmount - NEUTRAL_DRIVE_CURVE) *
        reactivityMix *
        (0.4 + anomalyMix * 0.6) *
        alertShapeProfile.drive,
    recoverAtOffsetSec:
      NEUTRAL_RECOVER_AT_SEC +
      (plan.recoverAtOffsetSec - NEUTRAL_RECOVER_AT_SEC) *
        reactivityMix *
        (0.3 + recoveryMix * 1.1) *
        alertShapeProfile.recover,
    transitionSec:
      NEUTRAL_TRANSITION_SEC +
      (plan.transitionSec - NEUTRAL_TRANSITION_SEC) *
        reactivityMix *
        (0.45 + recoveryMix * 0.75) *
        alertShapeProfile.transition,
    gateFloor:
      plan.gateFloor === null
        ? null
        : NEUTRAL_DECK_GAIN -
          (NEUTRAL_DECK_GAIN - plan.gateFloor) *
            reactivityMix *
            (0.18 + duckingMix * 0.42 + anomalyMix * 0.4) *
            alertShapeProfile.gate,
  };
}
