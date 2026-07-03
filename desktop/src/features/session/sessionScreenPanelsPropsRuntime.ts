import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenPanelsProps(input: BuildSessionScreenViewModelInput) {
  const { controller } = input;

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
