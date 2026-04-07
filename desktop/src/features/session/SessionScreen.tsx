import {
  Play,
  Pause,
  Trash2,
  Plus,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Radio,
} from "lucide-react";
import { useCallback, useState } from "react";
import type {
  LibraryTrack,
  RepositoryAnalysis,
  StreamAdapterKind,
  StartSessionInput,
} from "../../types/library";
import type { PersistedSession } from "../../api/sessions";
import { formatShortDate } from "../../utils/date";
import { useT } from "../../i18n/I18nContext";

interface SessionScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  selectedSessionId: string | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  activeSessionId: string | null;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
  ) => Promise<boolean>;
  onStopSession: () => Promise<void>;
  onResume: (sessionId: string) => void;
  onPlayback: (sessionId: string, label: string, sourcePath: string) => Promise<boolean>;
  onDelete: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
}

type QuickSessionMode = "log" | "repo";

export function SessionScreen({
  tracks,
  repositories,
  sessions,
  selectedSessionId,
  loading,
  mutating,
  error,
  activeSessionId,
  onStartSession,
  onStopSession,
  onResume,
  onPlayback,
  onDelete,
  onSelectSession,
}: SessionScreenProps) {
  const t = useT();
  const [mode, setMode] = useState<QuickSessionMode>("log");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);

  const handleCreateSession = useCallback(async () => {
    try {
      setCreateError(null);
      setCreating(true);

      if (mode === "log" && !selectedTrackId) {
        setCreateError("Select a track to monitor");
        return;
      }
      if (mode === "repo" && !selectedRepoId) {
        setCreateError("Select a repository to monitor");
        return;
      }

      const sessionId = `session_${Date.now()}`;
      const asset = mode === "log" ? selectedTrack : selectedRepo;

      if (!asset) {
        setCreateError("Asset not found");
        return;
      }

      const input: StartSessionInput = {
        sessionId,
        adapterKind: "file" as StreamAdapterKind,
        source: asset.sourcePath,
        label: sessionLabel || asset.title,
      };

      const success = await onStartSession(input, sessionId);
      if (success) {
        setSessionLabel("");
        setSelectedTrackId(null);
        setSelectedRepoId(null);
        setMode("log");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setCreating(false);
    }
  }, [mode, selectedTrackId, selectedRepoId, sessionLabel, onStartSession]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      try {
        setCreateError(null);
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;

        const asset =
          session.sourceId && tracks.some((t) => t.id === session.sourceId)
            ? tracks.find((t) => t.id === session.sourceId)
            : repositories.find((r) => r.id === session.sourceId);

        if (!asset) {
          setCreateError("Source asset not found");
          return;
        }

        const input: StartSessionInput = {
          sessionId: session.id,
          adapterKind: (session.adapterKind as StreamAdapterKind) || "file",
          source: asset.sourcePath,
          label: session.label || asset.title,
        };

        const success = await onStartSession(input, session.id);
        if (success) {
          onSelectSession(sessionId);
        }
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : "Failed to resume session",
        );
      }
    },
    [sessions, tracks, repositories, onStartSession, onSelectSession],
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const statusLabel = (status: string) =>
    status === "active" ? t.session.active
    : status === "paused" ? t.session.paused
    : t.session.stopped;

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.session.title}</p>
          <h2>{t.session.title}</h2>
          <p className="support-copy">{t.session.copy}</p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>{t.session.savedSessions}</span>
            <strong>{sessions.length}</strong>
          </div>
          {activeSession && (
            <div className="summary-pill session-pill-active">
              <span>{t.session.active}</span>
              <strong>{activeSession.label || "—"}</strong>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="notice session-notice-error">
          <p><AlertCircle size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />{error}</p>
        </div>
      )}

      {createError && (
        <div className="notice session-notice-warn">
          <p><AlertCircle size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />{createError}</p>
        </div>
      )}

      <div className="session-layout">
        {/* Left: Quick Create Form */}
        <section className="panel session-form-panel">
          <div className="panel-header">
            <h3>{t.session.newSession}</h3>
            <p className="support-copy">{t.session.newSessionCopy}</p>
          </div>

          <div className="session-mode-tabs">
            <button
              type="button"
              className={`session-mode-tab${mode === "log" ? " active" : ""}`}
              onClick={() => { setMode("log"); setSelectedRepoId(null); }}
            >
              {t.session.logFile}
            </button>
            <button
              type="button"
              className={`session-mode-tab${mode === "repo" ? " active" : ""}`}
              onClick={() => { setMode("repo"); setSelectedTrackId(null); }}
            >
              {t.session.repository}
            </button>
          </div>

          <div className="session-asset-list">
            {mode === "log" ? (
              <>
                <label className="field-label">{t.session.selectTrack}</label>
                {tracks.length === 0 ? (
                  <p className="placeholder">{t.session.noTracks}</p>
                ) : (
                  <div className="session-asset-options">
                    {tracks.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        className={`session-asset-option${selectedTrackId === track.id ? " selected" : ""}`}
                        onClick={() => setSelectedTrackId(track.id)}
                      >
                        <span className="session-asset-title">{track.title}</span>
                        <span className="session-asset-path">{track.sourcePath}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="field-label">{t.session.selectRepo}</label>
                {repositories.length === 0 ? (
                  <p className="placeholder">{t.session.noRepos}</p>
                ) : (
                  <div className="session-asset-options">
                    {repositories.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        className={`session-asset-option${selectedRepoId === repo.id ? " selected" : ""}`}
                        onClick={() => setSelectedRepoId(repo.id)}
                      >
                        <span className="session-asset-title">{repo.title}</span>
                        <span className="session-asset-path">{repo.sourcePath}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {(selectedTrack || selectedRepo) && (
            <div className="session-create-footer">
              <label className="field-label">{t.session.labelPlaceholder}</label>
              <input
                type="text"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder={selectedTrack?.title || selectedRepo?.title || "My session"}
                className="field-input"
              />
              <button
                type="button"
                className="action"
                onClick={handleCreateSession}
                disabled={creating || mutating}
              >
                <Plus size={14} />
                {t.session.startSession}
              </button>
            </div>
          )}
        </section>

        {/* Right: Sessions List */}
        <section className="panel session-list-panel">
          <div className="panel-header">
            <h3>{t.session.savedSessions}</h3>
            <p className="support-copy">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {activeSession && (
            <div className="session-active-banner">
              <div className="session-active-label">
                <Activity size={14} />
                <span>{t.session.active}: {activeSession.label || "—"}</span>
              </div>
              <button
                type="button"
                className="secondary-action"
                onClick={onStopSession}
                disabled={mutating}
              >
                <Pause size={14} />
                {t.session.stopSession}
              </button>
            </div>
          )}

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
                return (
                  <div
                    key={session.id}
                    className={`session-card${selectedSessionId === session.id ? " selected" : ""}${isActive ? " active" : ""}`}
                  >
                    <div
                      className="session-card-header"
                      onClick={() => onSelectSession(session.id)}
                    >
                      <div className="session-card-title-row">
                        <h4>{session.label || "Unnamed session"}</h4>
                        <span className={`session-status-badge status-${session.status}`}>
                          {statusLabel(session.status)}
                        </span>
                      </div>
                      <p className="session-card-source">
                        {session.sourceTitle || session.sourceId || "Unknown source"}
                      </p>
                    </div>

                    <div className="session-card-metrics">
                      <div className="session-metric">
                        <TrendingUp size={12} />
                        <span>{session.totalPolls} {t.session.polls}</span>
                      </div>
                      <div className="session-metric">
                        <Clock size={12} />
                        <span>{session.totalLines} {t.session.lines}</span>
                      </div>
                      <div className="session-metric">
                        <AlertCircle size={12} />
                        <span>{session.totalAnomalies} {t.session.anomalies}</span>
                      </div>
                    </div>

                    <p className="session-card-date">
                      {formatShortDate(session.updatedAt)}
                    </p>

                    <div className="session-card-actions">
                      {!isActive && session.totalPolls > 0 && (
                        <button
                          type="button"
                          className="action session-playback-action"
                          onClick={() =>
                            onPlayback(
                              session.id,
                              session.label || "Unnamed",
                              session.sourcePath || "",
                            )
                          }
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
                          onClick={() => handleResumeSession(session.id)}
                          disabled={mutating}
                        >
                          <Play size={12} />
                          {t.session.resume}
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondary-action session-delete-action"
                        onClick={() => onDelete(session.id)}
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
        </section>
      </div>
    </section>
  );
}
