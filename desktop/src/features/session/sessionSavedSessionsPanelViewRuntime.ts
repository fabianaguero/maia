import type { ComponentProps } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionReplayBookmarkPanel } from "./SessionReplayBookmarkPanel";
import type { SessionSavedSessionsList } from "./SessionSavedSessionsList";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import type { SessionSavedSessionsPanelProps } from "./sessionSavedSessionsPanelTypes";

export function buildSessionSavedSessionsPanelHeader(input: {
  t: AppTranslations;
  sessionsCount: number;
}) {
  return {
    title: input.t.session.savedSessions,
    summary: input.t.session.savedSessionsCount.replace("{count}", String(input.sessionsCount)),
  };
}

export function buildSessionSavedSessionsListProps(input: {
  t: AppTranslations;
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}): ComponentProps<typeof SessionSavedSessionsList> {
  return {
    sessions: input.sessions,
    loading: input.loading,
    mutating: input.mutating,
    selectedSessionId: input.selectedSessionId,
    activeSessionId: input.activeSessionId,
    activeSessionMode: input.activeSessionMode,
    sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
    liveWindowCount: input.liveWindowCount,
    liveProcessedLines: input.liveProcessedLines,
    liveTotalAnomalies: input.liveTotalAnomalies,
    emptyLabel: input.t.session.noSessions,
    loadingLabel: input.t.session.loading,
    onSelectSession: input.onSelectSession,
    onResumeSession: input.onResumeSession,
    onPlaybackSession: input.onPlaybackSession,
    onDeleteSession: input.onDeleteSession,
  };
}

export function buildSessionReplayBookmarkPanelProps(input: {
  selectedSession: PersistedSession;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  mutating: boolean;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}): ComponentProps<typeof SessionReplayBookmarkPanel> {
  return {
    selectedSession: input.selectedSession,
    selectedSessionBookmarks: input.selectedSessionBookmarks,
    selectedSessionReplayFeedbackRecommendation: input.selectedSessionReplayFeedbackRecommendation,
    bookmarkContexts: input.bookmarkContexts,
    mutating: input.mutating,
    onReplayBookmark: input.onReplayBookmark,
  };
}

export function buildSessionSavedSessionsPanelSections(
  input: SessionSavedSessionsPanelProps & { t: AppTranslations },
) {
  return {
    header: buildSessionSavedSessionsPanelHeader({
      t: input.t,
      sessionsCount: input.sessions.length,
    }),
    listProps: buildSessionSavedSessionsListProps({
      t: input.t,
      sessions: input.sessions,
      loading: input.loading,
      mutating: input.mutating,
      selectedSessionId: input.selectedSessionId,
      activeSessionId: input.activeSessionId,
      activeSessionMode: input.activeSessionMode,
      sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
      liveWindowCount: input.liveWindowCount,
      liveProcessedLines: input.liveProcessedLines,
      liveTotalAnomalies: input.liveTotalAnomalies,
      onSelectSession: input.onSelectSession,
      onResumeSession: input.onResumeSession,
      onPlaybackSession: input.onPlaybackSession,
      onDeleteSession: input.onDeleteSession,
    }),
    replayPanelProps: input.selectedSession
      ? buildSessionReplayBookmarkPanelProps({
          selectedSession: input.selectedSession,
          selectedSessionBookmarks: input.selectedSessionBookmarks,
          selectedSessionReplayFeedbackRecommendation:
            input.selectedSessionReplayFeedbackRecommendation,
          bookmarkContexts: input.bookmarkContexts,
          mutating: input.mutating,
          onReplayBookmark: input.onReplayBookmark,
        })
      : null,
  };
}
