import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenBoothInteractions(
  input: Pick<BuildSessionScreenViewModelInput, "controller" | "onStopSession">,
) {
  const { controller } = input;

  return {
    monitorSessionId: controller.monitor.session?.sessionId ?? null,
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

export function buildSessionScreenPanelsInteractions(
  input: Pick<BuildSessionScreenViewModelInput, "controller" | "onDelete" | "onSelectSession">,
) {
  const { controller } = input;

  return {
    onTemplateSelect: controller.setSelectedTemplateId,
    onBaseModeChange: controller.setBaseMode,
    onTrackSelect: controller.setSelectedTrackId,
    onPlaylistSelect: controller.setSelectedPlaylistId,
    onModeChange: (nextMode: typeof controller.mode) => {
      controller.setMode(nextMode);
      controller.setSelectedSourceId(null);
    },
    onSourceSelect: controller.setSelectedSourceId,
    onSessionLabelChange: controller.setSessionLabel,
    onCreateSession: controller.handleCreateSession,
    onSelectSession: input.onSelectSession,
    onResumeSession: (sessionId: string) => {
      void controller.handleResumeSession(sessionId);
    },
    onPlaybackSession: controller.handlePlaybackSession,
    onReplayBookmark: controller.handleReplayBookmark,
    onDeleteSession: (sessionId: string) => {
      void input.onDelete(sessionId);
    },
  };
}
