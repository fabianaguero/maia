import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorTrackMutationInput, MonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioRuntime";
import { createDriveCurve } from "./monitorTrackMutationRuntime";
import { shouldReuseSimpleMonitorBackgroundGraph } from "./simpleMonitorReactiveAudioOrchestrationRuntime";

interface SimpleMonitorReactiveAudioControllerLogger {
  warn: (message: string, error: unknown) => void;
}

export function ensureSimpleMonitorBackgroundGraphState(input: {
  existing: BackgroundTrackGraph | null;
  context: AudioContext;
  audio: HTMLAudioElement;
  masterVolume: number;
  logger: SimpleMonitorReactiveAudioControllerLogger;
}): BackgroundTrackGraph | null {
  if (
    shouldReuseSimpleMonitorBackgroundGraph({
      existing: input.existing,
      context: input.context,
      audio: input.audio,
    })
  ) {
    return input.existing;
  }

  try {
    const source = input.context.createMediaElementSource(input.audio);
    const filter = input.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 18000;
    filter.Q.value = 1;

    const dryGain = input.context.createGain();
    dryGain.gain.value = 1;

    const driveNode = input.context.createWaveShaper();
    driveNode.curve = createDriveCurve(1.2);
    driveNode.oversample = "4x";

    const driveWetGain = input.context.createGain();
    driveWetGain.gain.value = 0.0001;

    const outputGain = input.context.createGain();
    outputGain.gain.value = Math.max(0.04, input.masterVolume);

    const deckGain = input.context.createGain();
    deckGain.gain.value = 1;

    source.connect(filter);
    filter.connect(dryGain);
    dryGain.connect(outputGain);
    filter.connect(driveNode);
    driveNode.connect(driveWetGain);
    driveWetGain.connect(outputGain);
    outputGain.connect(deckGain);
    deckGain.connect(input.context.destination);

    return {
      context: input.context,
      audio: input.audio,
      source,
      filter,
      dryGain,
      driveNode,
      driveWetGain,
      outputGain,
      deckGain,
    };
  } catch (error) {
    input.logger.warn("Simple monitor graph setup failed", error);
    return null;
  }
}

export function applySimpleMonitorTrackMutationState(input: {
  update: MonitorTrackMutationInput;
  graph: BackgroundTrackGraph | null;
  audio: HTMLAudioElement | null;
  currentPressure: number;
  controls: MonitorDeckControls;
  buildMonitorTrackMutationPlan: (
    update: MonitorTrackMutationInput,
    currentPressure: number,
  ) => MonitorTrackMutationPlan;
  buildAdjustedMonitorTrackMutationPlan: (input: {
    plan: MonitorTrackMutationPlan;
    controls: MonitorDeckControls;
  }) => MonitorTrackMutationPlan;
  applyMonitorReactiveAudioPlan: (input: {
    graph: BackgroundTrackGraph;
    adjustedPlan: MonitorTrackMutationPlan;
    masterVolume: number;
    audio: HTMLAudioElement;
  }) => void;
}): { nextPressure: number } {
  if (!input.graph || !input.audio || input.graph.context.state !== "running") {
    return { nextPressure: input.currentPressure };
  }

  const plan = input.buildMonitorTrackMutationPlan(input.update, input.currentPressure);
  const masterVolume = Math.max(0.04, input.controls.masterVolume);
  const adjustedPlan = input.buildAdjustedMonitorTrackMutationPlan({
    plan,
    controls: input.controls,
  });

  input.applyMonitorReactiveAudioPlan({
    graph: input.graph,
    adjustedPlan,
    masterVolume,
    audio: input.audio,
  });

  return {
    nextPressure: adjustedPlan.nextPressure,
  };
}
