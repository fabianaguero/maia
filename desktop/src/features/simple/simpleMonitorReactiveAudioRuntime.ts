import type { MonitorTrackMutationPlan } from "./monitorAudioMutation";
import { applyAlertMonitorReactiveAudioPlan } from "./simpleMonitorReactiveAudioAlertRuntime";
import { applyNeutralMonitorReactiveAudioPlan } from "./simpleMonitorReactiveAudioNeutralRuntime";
import type {
  BackgroundTrackGraph,
  SimpleMonitorReactiveAudioHookState,
} from "./simpleMonitorReactiveAudioTypes";

export function applyMonitorReactiveAudioPlan(input: {
  graph: BackgroundTrackGraph;
  adjustedPlan: MonitorTrackMutationPlan;
  masterVolume: number;
  audio: HTMLAudioElement;
}): void {
  const { graph, adjustedPlan, masterVolume, audio } = input;
  const now = graph.context.currentTime;

  if (adjustedPlan.mode === "neutral") {
    applyNeutralMonitorReactiveAudioPlan({
      graph,
      adjustedPlan,
      audio,
      now,
    });
    return;
  }

  applyAlertMonitorReactiveAudioPlan({
    graph,
    adjustedPlan,
    masterVolume,
    audio,
    now,
  });
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
export type {
  BackgroundTrackGraph,
  SimpleMonitorReactiveAudioHookState,
} from "./simpleMonitorReactiveAudioTypes";
