import { Activity } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import { SessionReplayBookmarkPanel } from "./SessionReplayBookmarkPanel";
import { SessionSavedSessionCard } from "./SessionSavedSessionCard";

export interface SessionBookmarkContext {
  bpm: number | null;
  dominantLevel: string | null;
  anomalyCount: number | null;
  logExcerpt: string | null;
}

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

  return (
    <section className="panel session-list-panel">
      <div className="panel-header">
        <h3>{t.session.savedSessions}</h3>
        <p className="support-copy">
          {t.session.savedSessionsCount.replace("{count}", String(sessions.length))}
        </p>
      </div>

      <div className="session-card-list">
        {loading ? (
          <p className="placeholder">{t.session.loading}</p>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <Activity size={28} style={{ opacity: 0.3 }} />
            <p>{t.session.noSessions}</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isPlaybackSession = isActive && activeSessionMode === "playback";
            const sessionBookmarks = sessionBookmarksBySessionId[session.id] ?? [];

            return (
              <SessionSavedSessionCard
                key={session.id}
                session={session}
                selected={selectedSessionId === session.id}
                active={isActive}
                playbackActive={isPlaybackSession}
                mutating={mutating}
                bookmarks={sessionBookmarks}
                liveWindowCount={liveWindowCount}
                liveProcessedLines={liveProcessedLines}
                liveTotalAnomalies={liveTotalAnomalies}
                onSelectSession={onSelectSession}
                onResumeSession={onResumeSession}
                onPlaybackSession={onPlaybackSession}
                onDeleteSession={onDeleteSession}
              />
            );
          })
        )}
      </div>

      {selectedSession ? (
        <SessionReplayBookmarkPanel
          selectedSession={selectedSession}
          selectedSessionBookmarks={selectedSessionBookmarks}
          selectedSessionReplayFeedbackRecommendation={selectedSessionReplayFeedbackRecommendation}
          bookmarkContexts={bookmarkContexts}
          mutating={mutating}
          onReplayBookmark={onReplayBookmark}
        />
      ) : null}
    </section>
  );
}
