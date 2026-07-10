import React from "react";
import { AlertTriangle, Play, RefreshCw } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";
import { checkRepositoryExists } from "../../api/repositories";
import { BrandIcon } from "../../components/Branding";
import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack } from "../../types/library";
import {
  collectLocalSessionSourcePaths,
  collectReplayTrackLocalPaths,
} from "./pastSessionsAvailabilityRuntime";
import {
  buildLostPastSessionCleanupPlan,
  buildLostPastSessionsCleanupPlan,
  getLostPastSessionRows,
} from "./pastSessionsCleanupRuntime";
import { buildPastSessionsViewModel } from "./pastSessionsViewModel";

const FILE_EXISTENCE_CHECK_TIMEOUT_MS = 1200;

interface PastSessionsPanelProps {
  sessions: PersistedSession[];
  tracks: LibraryTrack[];
  onDeletePastSession: (sessionId: string) => Promise<void>;
  onDeleteLibraryTrack: (trackId: string) => Promise<boolean>;
  onReplaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => void;
}

async function checkLocalPathExists(path: string): Promise<boolean> {
  let timeout: number | null = null;

  try {
    return await Promise.race([
      checkRepositoryExists(path),
      new Promise<boolean>((resolve) => {
        timeout = window.setTimeout(() => resolve(false), FILE_EXISTENCE_CHECK_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
  }
}

export function PastSessionsPanel({
  sessions,
  tracks,
  onDeletePastSession,
  onDeleteLibraryTrack,
  onReplaySession,
}: PastSessionsPanelProps) {
  const t = useT();
  const [sourceExistsByPath, setSourceExistsByPath] = React.useState<Record<string, boolean>>({});
  const [trackExistsById, setTrackExistsById] = React.useState<Record<string, boolean>>({});
  const viewModel = buildPastSessionsViewModel({
    t,
    sessions,
    tracks,
    sourceExistsByPath,
    trackExistsById,
  });
  const [replayingSessionId, setReplayingSessionId] = React.useState<string | null>(null);
  const [cleaningSessionId, setCleaningSessionId] = React.useState<string | null>(null);
  const lostRows = getLostPastSessionRows(viewModel.rows);

  async function cleanLostSession(session: (typeof viewModel.rows)[number]): Promise<void> {
    const cleanupPlan = buildLostPastSessionCleanupPlan(session);
    if (
      cleanupPlan.sessionIds.length === 0 ||
      !window.confirm(t.library.confirmCleanLost.replace("{count}", "1"))
    ) {
      return;
    }

    setCleaningSessionId(session.id);
    try {
      for (const trackId of cleanupPlan.trackIds) {
        await onDeleteLibraryTrack(trackId);
      }
      for (const sessionId of cleanupPlan.sessionIds) {
        await onDeletePastSession(sessionId);
      }
    } finally {
      setCleaningSessionId((current) => (current === session.id ? null : current));
    }
  }

  async function cleanAllLostSessions(): Promise<void> {
    const cleanupPlan = buildLostPastSessionsCleanupPlan(lostRows);
    if (
      cleanupPlan.sessionIds.length === 0 ||
      !window.confirm(
        t.library.confirmCleanLost.replace("{count}", String(cleanupPlan.sessionIds.length)),
      )
    ) {
      return;
    }

    setCleaningSessionId("__all__");
    try {
      for (const trackId of cleanupPlan.trackIds) {
        await onDeleteLibraryTrack(trackId);
      }
      for (const sessionId of cleanupPlan.sessionIds) {
        await onDeletePastSession(sessionId);
      }
    } finally {
      setCleaningSessionId((current) => (current === "__all__" ? null : current));
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    const localPaths = collectLocalSessionSourcePaths(sessions);
    if (localPaths.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.all(
      localPaths.map(async (path) => [path, await checkLocalPathExists(path)] as const),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setSourceExistsByPath((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [sessions]);

  React.useEffect(() => {
    let cancelled = false;
    const trackPaths = collectReplayTrackLocalPaths(sessions, tracks);

    if (trackPaths.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.all(
      trackPaths.map(
        async ([trackId, path]) => [trackId, await checkLocalPathExists(path)] as const,
      ),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setTrackExistsById((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [sessions, tracks]);

  return (
    <div className="sessions-column">
      <div className="sessions-titlebar">
        <span className="sessions-title-glyph">
          <BrandIcon className="sessions-title-icon" />
        </span>
        <h3 className="sessions-title">{viewModel.title}</h3>
        {lostRows.length > 0 ? (
          <button
            className="btn-ghost sessions-clean-lost"
            disabled={cleaningSessionId !== null}
            onClick={() => void cleanAllLostSessions()}
          >
            {cleaningSessionId === "__all__" ? (
              <RefreshCw size={12} className="spin-ring" />
            ) : (
              <AlertTriangle size={12} />
            )}
            <span>{t.library.cleanLost}</span>
          </button>
        ) : null}
      </div>
      <div className="sessions-list">
        {viewModel.rows.length === 0 ? (
          <p className="text-muted sessions-empty">{viewModel.emptyStateLabel}</p>
        ) : (
          viewModel.rows.map((session) => (
            <div
              key={session.id}
              className={`session-row${session.invalidReason ? " session-row--invalid" : ""}`}
            >
              <div className="session-row__glyph">
                <BrandIcon className="session-row__icon" />
              </div>
              <div className="session-info">
                <div className="session-row__top">
                  <span className="session-name">{session.name}</span>
                  <span className={`session-status-chip ${session.status}`}>
                    {session.statusLabel}
                  </span>
                  {session.invalidReason ? (
                    <span className="session-invalid-chip" title={session.invalidReasonLabel ?? ""}>
                      <AlertTriangle size={10} />
                      {t.library.lost}
                    </span>
                  ) : null}
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
                  <div
                    className={`session-stat-card ${session.totalAnomalies > 0 ? "is-alert" : ""}`}
                  >
                    <span className="session-stat-card__label">
                      {t.simpleMode.monitor.anomalies}
                    </span>
                    <span className="session-stat-card__value">{session.totalAnomalies}</span>
                  </div>
                  <div className="session-stat-card">
                    <span className="session-stat-card__label">{t.simpleMode.common.lines}</span>
                    <span className="session-stat-card__value">{session.lineCountLabel}</span>
                  </div>
                </div>
                <div className="session-actions">
                  {session.invalidReason ? (
                    <button
                      className="btn-ghost btn-danger"
                      title={session.invalidReasonLabel ?? undefined}
                      disabled={cleaningSessionId !== null}
                      onClick={() => void cleanLostSession(session)}
                    >
                      {cleaningSessionId === session.id ? (
                        <RefreshCw size={14} className="spin-ring" />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      <span>
                        {cleaningSessionId === session.id
                          ? t.library.cleaningLost
                          : t.library.cleanLost}
                      </span>
                    </button>
                  ) : null}
                  <button
                    className="btn-ghost"
                    title={
                      session.invalidReasonLabel ??
                      (session.validationPending
                        ? t.simpleMode.monitor.validatingFiles
                        : t.simpleMode.common.replay)
                    }
                    disabled={
                      replayingSessionId !== null ||
                      session.validationPending ||
                      Boolean(session.invalidReason)
                    }
                    onClick={() =>
                      void (async () => {
                        setReplayingSessionId(session.id);
                        try {
                          await onReplaySession(
                            session.id,
                            session.replaySourcePath,
                            session.replaySourceTitle,
                            session.replayTrackId,
                          );
                        } finally {
                          setReplayingSessionId((current) =>
                            current === session.id ? null : current,
                          );
                        }
                      })()
                    }
                  >
                    {replayingSessionId === session.id || session.validationPending ? (
                      <RefreshCw size={14} className="spin-ring" />
                    ) : (
                      <Play size={14} />
                    )}
                    <span>
                      {replayingSessionId === session.id || session.validationPending
                        ? t.simpleMode.monitor.validatingFiles
                        : t.simpleMode.common.replay}
                    </span>
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
