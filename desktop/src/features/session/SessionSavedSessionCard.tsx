import { AlertCircle, Clock, Play, Radio, Trash2, TrendingUp } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import {
  buildSessionSavedSessionCardMetrics,
  resolveSessionSavedSessionCardActions,
  resolveSessionSavedSessionCardMeta,
  resolveSessionSavedSessionCardStatusLabel,
} from "./sessionSavedSessionCardRuntime";

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
  const statusLabel = resolveSessionSavedSessionCardStatusLabel({
    session,
    playbackActive,
    t,
  });
  const metrics = buildSessionSavedSessionCardMetrics({
    session,
    active,
    playbackActive,
    liveWindowCount,
    liveProcessedLines,
    liveTotalAnomalies,
    t,
  });
  const meta = resolveSessionSavedSessionCardMeta({
    session,
    bookmarks,
    t,
  });
  const actions = resolveSessionSavedSessionCardActions({
    active,
    session,
    mutating,
  });

  return (
    <div className={`session-card${selected ? " selected" : ""}${active ? " active" : ""}`}>
      <div className="session-card-header" onClick={() => onSelectSession(session.id)}>
        <div className="session-card-title-row">
          <h4>{meta.title}</h4>
          <span
            className={`session-status-badge status-${session.status}${
              playbackActive ? " status-playback" : ""
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="session-card-source">{meta.sourceLabel}</p>
        {meta.baseLabel && (
          <p className="session-card-base">
            {t.session.baseLabel}: {meta.baseLabel}
          </p>
        )}
        {meta.bookmarksLabel ? <p className="session-card-bookmarks">{meta.bookmarksLabel}</p> : null}
      </div>

      <div className="session-card-metrics">
        <div className="session-metric">
          <TrendingUp size={12} />
          <span>{metrics.pollsValue} {t.session.polls}</span>
        </div>
        <div className="session-metric">
          <Clock size={12} />
          <span>{metrics.linesValue} {t.session.lines}</span>
        </div>
        <div className="session-metric">
          <AlertCircle size={12} />
          <span>{metrics.anomaliesValue} {t.session.anomalies}</span>
        </div>
        <div className="session-metric">
          <span className="session-chip">{metrics.bpmLabel}</span>
        </div>
        <div className="session-metric">
          <span className="session-chip">{metrics.templateLabel}</span>
        </div>
      </div>

      <p className="session-card-date">{meta.updatedAtLabel}</p>

      <div className="session-card-actions">
        {actions.showPlaybackAction && (
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
        {actions.showResumeAction && (
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
          disabled={actions.deleteDisabled}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
