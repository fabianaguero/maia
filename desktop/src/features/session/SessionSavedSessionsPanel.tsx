import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import { SessionReplayBookmarkPanel } from "./SessionReplayBookmarkPanel";
import { SessionSavedSessionsList } from "./SessionSavedSessionsList";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import {
  buildSessionReplayBookmarkPanelProps,
  buildSessionSavedSessionsListProps,
  buildSessionSavedSessionsPanelHeader,
} from "./sessionSavedSessionsPanelViewRuntime";

interface SessionSavedSessionsPanelProps {
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  selectedSession: PersistedSession | null;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}

export function SessionSavedSessionsPanel({
  sessions,
  loading,
  mutating,
  selectedSessionId,
  selectedSession,
  selectedSessionBookmarks,
  selectedSessionReplayFeedbackRecommendation,
  sessionBookmarksBySessionId,
  bookmarkContexts,
  activeSessionId,
  activeSessionMode,
  liveWindowCount,
  liveProcessedLines,
  liveTotalAnomalies,
  onSelectSession,
  onResumeSession,
  onPlaybackSession,
  onReplayBookmark,
  onDeleteSession,
}: SessionSavedSessionsPanelProps) {
  const t = useT();
  const header = buildSessionSavedSessionsPanelHeader({
    t,
    sessionsCount: sessions.length,
  });
  const listProps = buildSessionSavedSessionsListProps({
    t,
    sessions,
    loading,
    mutating,
    selectedSessionId,
    activeSessionId,
    activeSessionMode,
    sessionBookmarksBySessionId,
    liveWindowCount,
    liveProcessedLines,
    liveTotalAnomalies,
    onSelectSession,
    onResumeSession,
    onPlaybackSession,
    onDeleteSession,
  });
  const replayPanelProps = selectedSession
    ? buildSessionReplayBookmarkPanelProps({
        selectedSession,
        selectedSessionBookmarks,
        selectedSessionReplayFeedbackRecommendation,
        bookmarkContexts,
        mutating,
        onReplayBookmark,
      })
    : null;

  return (
    <section className="panel session-list-panel">
      <div className="panel-header">
        <h3>{header.title}</h3>
        <p className="support-copy">{header.summary}</p>
      </div>

      <div className="session-card-list">
        <SessionSavedSessionsList {...listProps} />
      </div>

      {replayPanelProps ? <SessionReplayBookmarkPanel {...replayPanelProps} /> : null}
    </section>
  );
}
