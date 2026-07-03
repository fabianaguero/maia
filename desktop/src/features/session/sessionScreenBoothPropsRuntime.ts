import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenBoothProps(
  input: Pick<BuildSessionScreenViewModelInput, "mutating" | "onStopSession" | "controller">,
) {
  const { controller } = input;

  return {
    booth: controller.booth,
    playbackActive: controller.playbackActive,
    liveMonitorActive: controller.liveMonitorActive,
    mutating: input.mutating,
    readyToRun: controller.readyToRun,
    mode: controller.mode,
    latestUpdate: controller.latestUpdate,
    monitorSessionId: controller.monitor.session?.sessionId ?? null,
    isPlaybackPaused: controller.monitor.isPlaybackPaused,
    directPath: controller.directPath,
    isDirectLoading: controller.isDirectLoading,
    selectedSession: controller.selectedSession,
    creating: controller.creating,
    onDirectPathChange: controller.setDirectPath,
    onDirectLaunch: controller.handleDirectLaunch,
    onResumeSelected: () => {
      if (controller.selectedSession) {
        void controller.handleResumeSession(controller.selectedSession.id);
      }
    },
    onReplaySelected: async () => {
      if (controller.selectedSession) {
        await controller.handlePlaybackSession(controller.selectedSession);
      }
    },
    onCreateSession: controller.handleCreateSession,
    onStepPlaybackWindow: (direction: 1 | -1) => controller.monitor.stepPlaybackWindow(direction),
    onToggleReplayPlayback: () =>
      controller.monitor.isPlaybackPaused
        ? controller.monitor.resumePlayback()
        : controller.monitor.pausePlayback(),
    onStopSession: () => {
      void input.onStopSession();
    },
  };
}
