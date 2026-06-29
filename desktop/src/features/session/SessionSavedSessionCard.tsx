import { AlertCircle, Clock, Play, Radio, Trash2, TrendingUp } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel, resolveSessionStatusLabel } from "../../utils/monitorLabels";
import { resolveSessionTemplateLabel } from "./sessionDisplay";

interface SessionSavedSessionCardProps {
  session: PersistedSession;
  selected: boolean;
  active: boolean;
  playbackActive: boolean;
  mutating: boolean;
  bookmarks: SessionBookmark[];
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}

export function SessionSavedSessionCard({
  session,
  selected,
  active,
  playbackActive,
  mutating,
  bookmarks,
  liveWindowCount,
  liveProcessedLines,
  liveTotalAnomalies,
  onSelectSession,
  onResumeSession,
  onPlaybackSession,
  onDeleteSession,
}: SessionSavedSessionCardProps) {
  const t = useT();

  return (
    <div
      className={`session-card${selected ? " selected" : ""}${active ? " active" : ""}`}
    >
      <div className="session-card-header" onClick={() => onSelectSession(session.id)}>
        <div className="session-card-title-row">
          <h4>{session.label || t.session.unnamedSession}</h4>
          <span
            className={`session-status-badge status-${session.status}${
              playbackActive ? " status-playback" : ""
            }`}
          >
            {playbackActive ? t.session.replay : resolveSessionStatusLabel(session.status, t)}
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
        {bookmarks.length > 0 && (
          <p className="session-card-bookmarks">
            {t.session.replayNotesCount.replace("{count}", String(bookmarks.length))}
          </p>
        )}
      </div>

      <div className="session-card-metrics">
        <div className="session-metric">
          <TrendingUp size={12} />
          <span>{active && !playbackActive ? liveWindowCount : session.totalPolls} {t.session.polls}</span>
        </div>
        <div className="session-metric">
          <Clock size={12} />
          <span>{active && !playbackActive ? liveProcessedLines : session.totalLines} {t.session.lines}</span>
        </div>
        <div className="session-metric">
          <AlertCircle size={12} />
          <span>
            {active && !playbackActive ? liveTotalAnomalies : session.totalAnomalies} {t.session.anomalies}
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
        {!active && session.totalPolls > 0 && (
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
        {!active && (
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
          disabled={mutating || active}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
