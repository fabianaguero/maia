import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";
import { buildSessionScreenBoothInteractions } from "./sessionScreenInteractionRuntime";
import type { SessionScreenBoothVisualState } from "./sessionScreenBoothPropsContracts";

export function buildSessionScreenBoothVisualState(
  input: Pick<BuildSessionScreenViewModelInput, "mutating" | "controller">,
): SessionScreenBoothVisualState {
  const { controller } = input;

  return {
    booth: controller.booth,
    playbackActive: controller.playbackActive,
    liveMonitorActive: controller.liveMonitorActive,
    mutating: input.mutating,
    readyToRun: controller.readyToRun,
    mode: controller.mode,
    latestUpdate: controller.latestUpdate,
    isPlaybackPaused: controller.monitor.isPlaybackPaused,
    directPath: controller.directPath,
    isDirectLoading: controller.isDirectLoading,
    selectedSession: controller.selectedSession,
    creating: controller.creating,
  };
}

export function buildSessionScreenBoothProps(
  input: Pick<BuildSessionScreenViewModelInput, "mutating" | "onStopSession" | "controller">,
) {
  const visualState = buildSessionScreenBoothVisualState(input);
  const interactions = buildSessionScreenBoothInteractions(input);

  return {
    ...visualState,
    monitorSessionId: interactions.monitorSessionId,
    onDirectPathChange: interactions.onDirectPathChange,
    onDirectLaunch: interactions.onDirectLaunch,
    onResumeSelected: interactions.onResumeSelected,
    onReplaySelected: interactions.onReplaySelected,
    onCreateSession: interactions.onCreateSession,
    onStepPlaybackWindow: interactions.onStepPlaybackWindow,
    onToggleReplayPlayback: interactions.onToggleReplayPlayback,
    onStopSession: interactions.onStopSession,
  };
}
