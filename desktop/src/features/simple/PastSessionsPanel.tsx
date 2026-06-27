import React from "react";
import { Play } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";
import { BrandIcon } from "../../components/Branding";
import { useT } from "../../i18n/I18nContext";
import { buildPastSessionsViewModel } from "./pastSessionsViewModel";

interface PastSessionsPanelProps {
  sessions: PersistedSession[];
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
}

export function PastSessionsPanel({ sessions, onReplaySession }: PastSessionsPanelProps) {
  const t = useT();
  const viewModel = buildPastSessionsViewModel({ t, sessions });

  return (
    <div className="sessions-column">
      <div className="sessions-titlebar">
        <span className="sessions-title-glyph">
          <BrandIcon className="sessions-title-icon" />
        </span>
        <h3 className="sessions-title">{viewModel.title}</h3>
      </div>
      <div className="sessions-list">
        {viewModel.rows.length === 0 ? (
          <p className="text-muted sessions-empty">
            {viewModel.emptyStateLabel}
          </p>
        ) : (
          viewModel.rows.map((session) => (
            <div key={session.id} className="session-row">
              <div className="session-row__glyph">
                <BrandIcon className="session-row__icon" />
              </div>
              <div className="session-info">
                <div className="session-row__top">
                  <span className="session-name">{session.name}</span>
                  <span className={`session-status-chip ${session.status}`}>{session.statusLabel}</span>
                </div>
                <div className="session-row__identity">
                  <span className="session-track-chip">{session.trackLabel}</span>
                </div>
                <span className="session-source">{session.sourcePathLabel}</span>
                <div className="session-row__meta">
                  <span className="session-meta-chip">{session.sourceBasenameLabel}</span>
                  <span className="session-meta-text">{session.updatedAtLabel}</span>
                </div>
              </div>
              <div className="session-side">
                <div className="session-stats">
                  <div className={`session-stat-card ${session.totalAnomalies > 0 ? "is-alert" : ""}`}>
                    <span className="session-stat-card__label">{t.simpleMode.monitor.anomalies}</span>
                    <span className="session-stat-card__value">{session.totalAnomalies}</span>
                  </div>
                  <div className="session-stat-card">
                    <span className="session-stat-card__label">{t.simpleMode.common.lines}</span>
                    <span className="session-stat-card__value">{session.lineCountLabel}</span>
                  </div>
                </div>
                <div className="session-actions">
                  <button
                    className="btn-ghost"
                    title={t.simpleMode.common.replay}
                    onClick={() =>
                      onReplaySession(session.id, session.replaySourcePath, session.replaySourceTitle)
                    }
                  >
                    <Play size={14} />
                    <span>{t.simpleMode.common.replay}</span>
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
