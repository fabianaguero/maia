import React from "react";
import { Play } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import { resolveSessionStatusLabel } from "../../utils/monitorLabels";
import { getBasename, truncateMiddle } from "./monitorDisplay";
import { formatSessionLineCount, formatSessionUpdatedAt } from "./monitorSessions";

interface PastSessionsPanelProps {
  sessions: PersistedSession[];
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
}

export function PastSessionsPanel({ sessions, onReplaySession }: PastSessionsPanelProps) {
  const t = useT();

  return (
    <div className="sessions-column">
      <h3 className="sessions-title">{t.simpleMode.setup.pastSessions}</h3>
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <p className="text-muted" style={{ padding: "1rem", fontSize: "13px" }}>
            {t.simpleMode.setup.noPreviousSessions}
          </p>
        ) : (
          sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="session-row">
              <div className="session-info">
                <div className="session-row__top">
                  <div className="session-row__identity">
                    <span className="session-name">
                      {session.label || session.sourceTitle || t.simpleMode.common.untitledSession}
                    </span>
                    <span className="session-track-chip">
                      {session.trackTitle || t.simpleMode.common.noTrack}
                    </span>
                  </div>
                  <span className={`session-status-chip ${session.status}`}>
                    {resolveSessionStatusLabel(session.status, t)}
                  </span>
                </div>
                <span className="session-source">{truncateMiddle(session.sourcePath, 74)}</span>
                <div className="session-row__meta">
                  <span className="session-meta-chip">{getBasename(session.sourcePath)}</span>
                  <span className="session-meta-text">
                    {t.simpleMode.common.updated} {formatSessionUpdatedAt(session.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="session-side">
                <div className="session-stats">
                  {session.totalAnomalies > 0 ? (
                    <span className="badge-anomalies">{session.totalAnomalies}</span>
                  ) : null}
                  <span className="session-duration">
                    {formatSessionLineCount(session.totalLines)}
                  </span>
                </div>
                <div className="session-actions">
                  <button
                    className="btn-ghost"
                    title={t.simpleMode.common.replay}
                    onClick={() =>
                      onReplaySession(
                        session.id,
                        session.sourcePath || "",
                        session.sourceTitle || t.simpleMode.common.untitledSession,
                      )
                    }
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
