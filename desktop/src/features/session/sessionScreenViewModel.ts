import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import type { SessionBookmark } from "../../api/sessions";
import type { ComponentProps } from "react";

import type { SessionBoothPanel } from "./SessionBoothPanel";
import type { SessionScreenHeader } from "./SessionScreenHeader";
import type { SessionScreenNoticeStack } from "./SessionScreenNoticeStack";
import type { SessionScreenPanels } from "./SessionScreenPanels";
import type { useSessionScreenController } from "./useSessionScreenController";

type SessionScreenControllerValue = ReturnType<typeof useSessionScreenController>;

interface BuildSessionScreenViewModelInput {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sessions: ComponentProps<typeof SessionScreenPanels>["sessions"];
  sessionsCount: number;
  selectedSessionId: string | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  onStopSession: () => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  controller: SessionScreenControllerValue;
}

export interface SessionScreenViewModel {
  headerProps: ComponentProps<typeof SessionScreenHeader>;
  noticeProps: ComponentProps<typeof SessionScreenNoticeStack>;
  boothProps: ComponentProps<typeof SessionBoothPanel>;
  panelsProps: ComponentProps<typeof SessionScreenPanels>;
}

export function buildSessionScreenViewModel(
  input: BuildSessionScreenViewModelInput,
): SessionScreenViewModel {
  const {
    sessionsCount,
    selectedSessionId,
    loading,
    mutating,
    error,
    activeSessionId,
    activeSessionMode,
    tracks,
    playlists,
    sessions,
    sessionBookmarksBySessionId,
    onStopSession,
    onDelete,
    onSelectSession,
    controller,
  } = input;

  return {
    headerProps: {
      sessionsCount,
      activeSession: controller.activeSession ?? null,
    },
    noticeProps: {
      error,
      createError: controller.createError,
    },
    boothProps: {
      booth: controller.booth,
      playbackActive: controller.playbackActive,
      liveMonitorActive: controller.liveMonitorActive,
      mutating,
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
      onStepPlaybackWindow: (direction) => controller.monitor.stepPlaybackWindow(direction),
      onToggleReplayPlayback: () =>
        controller.monitor.isPlaybackPaused
          ? controller.monitor.resumePlayback()
          : controller.monitor.pausePlayback(),
      onStopSession: () => {
        void onStopSession();
      },
    },
    panelsProps: {
      tracks,
      playlists,
      sessions,
      loading,
      mutating,
      selectedSessionId,
      activeSessionId,
      activeSessionMode,
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
      sessionBookmarksBySessionId,
      bookmarkContexts: controller.bookmarkContexts,
      liveWindowCount: controller.monitor.metrics.windowCount,
      liveProcessedLines: controller.monitor.metrics.processedLines,
      liveTotalAnomalies: controller.monitor.metrics.totalAnomalies,
      onTemplateSelect: controller.setSelectedTemplateId,
      onBaseModeChange: controller.setBaseMode,
      onTrackSelect: controller.setSelectedTrackId,
      onPlaylistSelect: controller.setSelectedPlaylistId,
      onModeChange: (nextMode) => {
        controller.setMode(nextMode);
        controller.setSelectedSourceId(null);
      },
      onSourceSelect: controller.setSelectedSourceId,
      onSessionLabelChange: controller.setSessionLabel,
      onCreateSession: controller.handleCreateSession,
      onSelectSession,
      onResumeSession: (sessionId) => {
        void controller.handleResumeSession(sessionId);
      },
      onPlaybackSession: controller.handlePlaybackSession,
      onReplayBookmark: controller.handleReplayBookmark,
      onDeleteSession: (sessionId) => {
        void onDelete(sessionId);
      },
    },
  };
}
