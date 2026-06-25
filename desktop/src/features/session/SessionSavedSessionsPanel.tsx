import { Activity, AlertCircle, Clock, Play, Radio, Trash2, TrendingUp } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import { resolveReplayBookmarkTagLabel } from "../../config/replayBookmarks";
import { resolveMutationProfile, resolveStyleProfile } from "../../config/liveProfiles";
import { useT } from "../../i18n/I18nContext";
import { formatShortDate, formatShortDateTime } from "../../utils/date";
import {
  formatBpmLabel,
  formatDominantLevelLabel,
  resolveSessionStatusLabel,
} from "../../utils/monitorLabels";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import { resolveSessionTemplateLabel } from "./sessionDisplay";

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
              <div
                key={session.id}
                className={`session-card${selectedSessionId === session.id ? " selected" : ""}${isActive ? " active" : ""}`}
              >
                <div className="session-card-header" onClick={() => onSelectSession(session.id)}>
                  <div className="session-card-title-row">
                    <h4>{session.label || t.session.unnamedSession}</h4>
                    <span
                      className={`session-status-badge status-${session.status}${
                        isPlaybackSession ? " status-playback" : ""
                      }`}
                    >
                      {isPlaybackSession
                        ? t.session.replay
                        : resolveSessionStatusLabel(session.status, t)}
                    </span>
                  </div>
                  <p className="session-card-source">
                    {session.sourceTitle || session.sourceId || t.session.unknownSource}
                  </p>
                  {(session.playlistName || session.trackTitle) && (
                    <p className="session-card-base">
                      {t.session.baseLabel}: {session.playlistName || session.trackTitle}
                    </p>
                  )}
                  {sessionBookmarks.length > 0 && (
                    <p className="session-card-bookmarks">
                      {t.session.replayNotesCount.replace(
                        "{count}",
                        String(sessionBookmarks.length),
                      )}
                    </p>
                  )}
                </div>

                <div className="session-card-metrics">
                  <div className="session-metric">
                    <TrendingUp size={12} />
                    <span>
                      {isActive && !isPlaybackSession ? liveWindowCount : session.totalPolls}{" "}
                      {t.session.polls}
                    </span>
                  </div>
                  <div className="session-metric">
                    <Clock size={12} />
                    <span>
                      {isActive && !isPlaybackSession ? liveProcessedLines : session.totalLines}{" "}
                      {t.session.lines}
                    </span>
                  </div>
                  <div className="session-metric">
                    <AlertCircle size={12} />
                    <span>
                      {isActive && !isPlaybackSession ? liveTotalAnomalies : session.totalAnomalies}{" "}
                      {t.session.anomalies}
                    </span>
                  </div>
                  <div className="session-metric">
                    <span className="session-chip">{formatBpmLabel(session.lastBpm)}</span>
                  </div>
                  <div className="session-metric">
                    <span className="session-chip">
                      {resolveSessionTemplateLabel(
                        session.sourceTemplateId,
                        t,
                        t.session.noTemplate,
                        t.session.unknownTemplate,
                      )}
                    </span>
                  </div>
                </div>

                <p className="session-card-date">{formatShortDate(session.updatedAt)}</p>

                <div className="session-card-actions">
                  {!isActive && session.totalPolls > 0 && (
                    <button
                      type="button"
                      className="action session-playback-action"
                      onClick={() => onPlaybackSession(session)}
                      disabled={mutating}
                    >
                      <Radio size={12} />
                      {t.session.playback}
                    </button>
                  )}
                  {!isActive && (
                    <button
                      type="button"
                      className="action session-resume-action"
                      onClick={() => onResumeSession(session.id)}
                      disabled={mutating}
                    >
                      <Play size={12} />
                      {t.session.resume}
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-action session-delete-action"
                    onClick={() => onDeleteSession(session.id)}
                    disabled={mutating || isActive}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedSession ? (
        <div className="session-bookmark-panel">
          <div className="panel-header compact">
            <div>
              <h3>{t.session.replayNotes}</h3>
              <p className="support-copy">
                {t.session.replayNotesFor.replace(
                  "{label}",
                  selectedSession.label || t.session.unnamedSession,
                )}
              </p>
            </div>
          </div>
          {selectedSessionReplayFeedbackRecommendation ? (
            <ReplayFeedbackSummaryCard
              recommendation={selectedSessionReplayFeedbackRecommendation}
              title={t.session.recommendedMix}
              className="top-spaced"
            />
          ) : null}
          {selectedSessionBookmarks.length > 0 ? (
            <div className="session-bookmark-list">
              {selectedSessionBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="session-bookmark-card">
                  <div className="session-bookmark-card-copy">
                    <div className="session-bookmark-card-head">
                      <strong>{bookmark.label}</strong>
                      <span>
                        {t.session.windowShort.replace(
                          "{index}",
                          String(bookmark.replayWindowIndex),
                        )}
                      </span>
                    </div>
                    <p>{bookmark.note || t.session.bookmarkNoNote}</p>
                    <div className="session-bookmark-card-meta">
                      {bookmark.bookmarkTag ? (
                        <span>{resolveReplayBookmarkTagLabel(bookmark.bookmarkTag)}</span>
                      ) : null}
                      {bookmark.suggestedStyleProfileId ? (
                        <span>{resolveStyleProfile(bookmark.suggestedStyleProfileId).label}</span>
                      ) : null}
                      {bookmark.suggestedMutationProfileId ? (
                        <span>
                          {resolveMutationProfile(bookmark.suggestedMutationProfileId).label}
                        </span>
                      ) : null}
                      <span>{formatShortDateTime(bookmark.updatedAt)}</span>
                      {bookmark.trackTitle ? <span>{bookmark.trackTitle}</span> : null}
                      {typeof bookmark.trackSecond === "number" ? (
                        <span>{bookmark.trackSecond.toFixed(2)}s</span>
                      ) : null}
                    </div>
                    {bookmarkContexts[bookmark.id] && (
                      <div className="session-bookmark-card-context">
                        <span className="context-field">
                          {formatBpmLabel(bookmarkContexts[bookmark.id].bpm)}
                        </span>
                        <span className="context-field">
                          {formatDominantLevelLabel(bookmarkContexts[bookmark.id].dominantLevel)}
                        </span>
                        <span className="context-field">
                          {t.session.bookmarkAnomalies.replace(
                            "{count}",
                            String(bookmarkContexts[bookmark.id].anomalyCount ?? 0),
                          )}
                        </span>
                        <span className="context-field context-field--excerpt">
                          {bookmarkContexts[bookmark.id].logExcerpt ??
                            t.session.noLogExcerptAvailable}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => onReplayBookmark(selectedSession, bookmark.replayWindowIndex)}
                    disabled={mutating || selectedSession.totalPolls === 0}
                  >
                    <Radio size={12} />
                    {t.session.replayHere}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state session-bookmark-empty">
              <Radio size={24} style={{ opacity: 0.28 }} />
              <p>{t.session.noReplayNotesSavedYet}</p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
