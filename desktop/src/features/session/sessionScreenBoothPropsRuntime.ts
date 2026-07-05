import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";
import { buildSessionScreenBoothInteractions } from "./sessionScreenInteractionRuntime";

export function buildSessionScreenBoothProps(
  input: Pick<BuildSessionScreenViewModelInput, "mutating" | "onStopSession" | "controller">,
) {
  const { controller } = input;
  const interactions = buildSessionScreenBoothInteractions(input);

  return {
    booth: controller.booth,
    playbackActive: controller.playbackActive,
    liveMonitorActive: controller.liveMonitorActive,
    mutating: input.mutating,
    readyToRun: controller.readyToRun,
    mode: controller.mode,
    latestUpdate: controller.latestUpdate,
    monitorSessionId: interactions.monitorSessionId,
    isPlaybackPaused: controller.monitor.isPlaybackPaused,
    directPath: controller.directPath,
    isDirectLoading: controller.isDirectLoading,
    selectedSession: controller.selectedSession,
    creating: controller.creating,
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
