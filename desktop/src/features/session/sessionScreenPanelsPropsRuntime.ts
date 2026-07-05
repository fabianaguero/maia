import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";
import { buildSessionScreenPanelsInteractions } from "./sessionScreenInteractionRuntime";

export function buildSessionScreenPanelsProps(input: BuildSessionScreenViewModelInput) {
  const { controller } = input;
  const interactions = buildSessionScreenPanelsInteractions(input);

  return {
    tracks: input.tracks,
    playlists: input.playlists,
    sessions: input.sessions,
    loading: input.loading,
    mutating: input.mutating,
    selectedSessionId: input.selectedSessionId,
    activeSessionId: input.activeSessionId,
    activeSessionMode: input.activeSessionMode,
    mode: controller.mode,
    baseMode: controller.baseMode,
    selectedTemplateId: controller.selectedTemplateId,
    selectedSourceId: controller.selectedSourceId,
    selectedTrackId: controller.selectedTrackId,
    selectedPlaylistId: controller.selectedPlaylistId,
    selectedSource: controller.selectedSource,
    selectedTrack: controller.selectedTrack,
    selectedPlaylist: controller.selectedPlaylist,
    selectedBaseLabel: controller.selectedBaseDetails.label,
    selectedBaseDetail: controller.selectedBaseDetails.detail,
    sessionLabel: controller.sessionLabel,
    sessionLabelPlaceholder: controller.sessionLabelPlaceholder,
    creating: controller.creating,
    sourceOptions: controller.sourceOptions,
    selectedSession: controller.selectedSession,
    selectedSessionBookmarks: controller.selectedSessionBookmarks,
    selectedSessionReplayFeedbackRecommendation:
      controller.selectedSessionReplayFeedbackRecommendation,
    sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
    bookmarkContexts: controller.bookmarkContexts,
    liveWindowCount: controller.monitor.metrics.windowCount,
    liveProcessedLines: controller.monitor.metrics.processedLines,
    liveTotalAnomalies: controller.monitor.metrics.totalAnomalies,
    ...interactions,
  };
}
