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
import { useCallback, useMemo, useState } from "react";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
} from "../../types/library";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import { formatShortDate, formatShortDateTime } from "../../utils/date";
import { useT } from "../../i18n/I18nContext";
import { resolveReplayBookmarkTagLabel } from "../../config/replayBookmarks";
import { resolveMutationProfile, resolveStyleProfile } from "../../config/liveProfiles";
import { useReplayFeedbackRecommendation } from "../../hooks/useReplayFeedbackRecommendation";
import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle } from "../../utils/track";

interface SessionStartDraft {
  sourceId?: string;
  trackId?: string;
  playlistId?: string;
}

interface SessionScreenProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionId: string | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  activePlaybackProgress: number | null;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onStopSession: () => Promise<void>;
  onResume: (sessionId: string) => void;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (
    session: PersistedSession,
    replayWindowIndex: number,
  ) => Promise<boolean>;
  onDelete: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
}

type QuickSessionMode = "log" | "repo";
type SessionBaseMode = "track" | "playlist";

export function SessionScreen({
  tracks,
  playlists,
  repositories,
  sessions,
  sessionBookmarksBySessionId,
  selectedSessionId,
  loading,
  mutating,
  error,
  activeSessionId,
  activeSessionMode,
  activePlaybackProgress,
  onStartSession,
  onStopSession,
  onResume,
  onPlayback,
  onReplayBookmark,
  onDelete,
  onSelectSession,
}: SessionScreenProps) {
  const t = useT();
  const [mode, setMode] = useState<QuickSessionMode>("log");
  const [baseMode, setBaseMode] = useState<SessionBaseMode>(
    tracks.length > 0 ? "track" : "playlist",
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const logSources = useMemo(
    () => repositories.filter((entry) => entry.sourceKind === "file"),
    [repositories],
  );
  const repoSources = useMemo(
    () => repositories.filter((entry) => entry.sourceKind !== "file"),
    [repositories],
  );
  const sourceOptions = mode === "log" ? logSources : repoSources;
  const selectedSource =
    repositories.find((repository) => repository.id === selectedSourceId) ?? null;
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;
  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const selectedPlaylistBpm = getPlaylistMedianBpm(selectedPlaylist, tracks);
  const selectedBaseLabel =
    baseMode === "playlist"
      ? selectedPlaylist?.name ?? null
      : selectedTrack?.tags.title ?? null;

  const handleCreateSession = useCallback(async () => {
    try {
      setCreateError(null);
      setCreating(true);

      if (!selectedSourceId) {
        setCreateError(
          mode === "log"
            ? "Select a log source to monitor."
            : "Select a repository source to monitor.",
        );
        return;
      }

      if (baseMode === "track" && !selectedTrackId) {
        setCreateError("Select a base track for the session.");
        return;
      }

      if (baseMode === "playlist" && !selectedPlaylistId) {
        setCreateError("Select a base playlist for the session.");
        return;
      }

      const source = repositories.find((entry) => entry.id === selectedSourceId);
      if (!source) {
        setCreateError("Source asset not found.");
        return;
      }

      const sessionId = `session_${Date.now()}`;
      const input: StartSessionInput = {
        sessionId,
        adapterKind: "file" as StreamAdapterKind,
        source: source.sourcePath,
        label: sessionLabel || source.title,
      };

      const success = await onStartSession(input, sessionId, {
        sourceId: source.id,
        trackId: baseMode === "track" ? selectedTrackId ?? undefined : undefined,
        playlistId:
          baseMode === "playlist" ? selectedPlaylistId ?? undefined : undefined,
      });

      if (success) {
        setSessionLabel("");
        setSelectedSourceId(null);
        setSelectedTrackId(null);
        setSelectedPlaylistId(null);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setCreating(false);
    }
  }, [
    baseMode,
    mode,
    onStartSession,
    repositories,
    selectedPlaylistId,
    selectedSourceId,
    selectedTrackId,
    sessionLabel,
  ]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      try {
        setCreateError(null);
        const session = sessions.find((entry) => entry.id === sessionId);
        if (!session) {
          return;
        }

        const source = repositories.find(
          (repository) => repository.id === session.sourceId,
        );
        if (!source) {
          setCreateError("Source asset not found");
          return;
        }

        const input: StartSessionInput = {
          sessionId: session.id,
          adapterKind: (session.adapterKind as StreamAdapterKind) || "file",
          source: source.sourcePath,
          label: session.label || source.title,
        };

        const success = await onStartSession(input, session.id, {
          sourceId: session.sourceId ?? undefined,
          trackId: session.trackId ?? undefined,
          playlistId: session.playlistId ?? undefined,
        });
        if (success) {
          onResume(sessionId);
          onSelectSession(sessionId);
        }
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : "Failed to resume session",
        );
      }
    },
    [onResume, onSelectSession, onStartSession, repositories, sessions],
  );

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    activeSession ??
    sessions[0] ??
    null;
  const selectedSessionBookmarks = selectedSession
    ? sessionBookmarksBySessionId[selectedSession.id] ?? []
    : [];
  const selectedSessionReplayFeedbackRecommendation = useReplayFeedbackRecommendation(
    selectedSessionBookmarks,
  );
  const playbackActive = activeSessionMode === "playback" && Boolean(activeSession);
  const playbackPercent =
    typeof activePlaybackProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(activePlaybackProgress * 100)))
      : null;

  const statusLabel = (status: string) =>
    status === "active"
      ? t.session.active
      : status === "paused"
        ? t.session.paused
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
          <p>
            <AlertCircle
              size={14}
              style={{
                display: "inline",
                verticalAlign: "-2px",
                marginRight: 6,
              }}
            />
            {error}
          </p>
        </div>
      )}

      {createError && (
        <div className="notice session-notice-warn">
          <p>
            <AlertCircle
              size={14}
              style={{
                display: "inline",
                verticalAlign: "-2px",
                marginRight: 6,
              }}
            />
            {createError}
          </p>
        </div>
      )}

      <div className="session-layout">
        <section className="panel session-form-panel">
          <div className="panel-header">
            <h3>New session</h3>
            <p className="support-copy">
              Arm a listening bed, pick a live source, then run.
            </p>
          </div>

          {/* Progress strip — same vocabulary as the monitor deck */}
          <div className="workflow-strip" aria-hidden="true">
            <div className="workflow-step-wrap">
              <span
                className={`workflow-step${
                  (baseMode === "track" && selectedTrackId) ||
                  (baseMode === "playlist" && selectedPlaylistId)
                    ? " active"
                    : ""
                }`}
              >
                Base Bed
              </span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span
                className={`workflow-step${selectedSourceId ? " active" : ""}`}
              >
                Source Feed
              </span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span className="workflow-step active">Name</span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span className="workflow-step">Run</span>
            </div>
          </div>

          <div className="monitor-setup-grid">
            {/* ── Step 1: Base listening bed ─────────────────────────── */}
            <div className="audio-path-card monitor-setup-card">
              <span>1. Base listening bed</span>
              <p className="monitor-empty-hint">
                A track or playlist that stays musical while the source feeds in.
              </p>

              <div className="session-mode-tabs">
                <button
                  type="button"
                  className={`session-mode-tab${baseMode === "track" ? " active" : ""}`}
                  onClick={() => setBaseMode("track")}
                  disabled={tracks.length === 0}
                >
                  Track
                </button>
                <button
                  type="button"
                  className={`session-mode-tab${baseMode === "playlist" ? " active" : ""}`}
                  onClick={() => setBaseMode("playlist")}
                  disabled={playlists.length === 0}
                >
                  Playlist
                </button>
              </div>

              {baseMode === "track" ? (
                tracks.length === 0 ? (
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
                        <span className="session-asset-title">{getTrackTitle(track)}</span>
                        <span className="session-asset-path">
                          {track.analysis.bpm?.toFixed(0) ?? "—"} BPM
                        </span>
                      </button>
                    ))}
                  </div>
                )
              ) : playlists.length === 0 ? (
                <p className="placeholder">No saved playlists yet.</p>
              ) : (
                <div className="session-asset-options">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      className={`session-asset-option${selectedPlaylistId === playlist.id ? " selected" : ""}`}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                    >
                      <span className="session-asset-title">{playlist.name}</span>
                      <span className="session-asset-path">
                        {playlist.trackIds.length} tracks · median{" "}
                        {getPlaylistMedianBpm(playlist, tracks)?.toFixed(0) ?? "?"} BPM
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {(selectedTrack || selectedPlaylist) && (
                <div className="monitor-source-summary">
                  <small>Armed</small>
                  <strong>{selectedBaseLabel}</strong>
                  <small style={{ marginTop: 4 }}>
                    {baseMode === "playlist"
                      ? `${selectedPlaylist?.trackIds.length ?? 0} tracks · median ${selectedPlaylistBpm?.toFixed(0) ?? "?"} BPM`
                      : `${selectedTrack?.analysis.bpm?.toFixed(0) ?? "?"} BPM`}
                  </small>
                </div>
              )}
            </div>

            {/* ── Step 2: Source feed ────────────────────────────────── */}
            <div className="audio-path-card monitor-setup-card">
              <span>2. Source feed</span>
              <p className="monitor-empty-hint">
                The live data stream Maia will listen to and translate.
              </p>

              <div className="session-mode-tabs">
                <button
                  type="button"
                  className={`session-mode-tab${mode === "log" ? " active" : ""}`}
                  onClick={() => {
                    setMode("log");
                    setSelectedSourceId(null);
                  }}
                >
                  Log file
                </button>
                <button
                  type="button"
                  className={`session-mode-tab${mode === "repo" ? " active" : ""}`}
                  onClick={() => {
                    setMode("repo");
                    setSelectedSourceId(null);
                  }}
                >
                  Repository
                </button>
              </div>

              {sourceOptions.length === 0 ? (
                <p className="placeholder">
                  {mode === "log"
                    ? "No imported log files yet."
                    : "No imported repositories yet."}
                </p>
              ) : (
                <div className="session-asset-options">
                  {sourceOptions.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      className={`session-asset-option${selectedSourceId === source.id ? " selected" : ""}`}
                      onClick={() => setSelectedSourceId(source.id)}
                    >
                      <span className="session-asset-title">{source.title}</span>
                      <span className="session-asset-path">{source.sourcePath}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedSource && (
                <div className="monitor-source-summary">
                  <small>Selected</small>
                  <strong>{selectedSource.title}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ── Steps 3 + 4: Name and Run ─────────────────────────────── */}
          <div className="session-create-footer">
            <label className="field-label">3. Session name (optional)</label>
            <input
              type="text"
              value={sessionLabel}
              onChange={(event) => setSessionLabel(event.target.value)}
              placeholder={
                selectedSource && selectedBaseLabel
                  ? `${selectedSource.title} · ${selectedBaseLabel}`
                  : "Give this session a name…"
              }
              className="field-input"
            />

            <div className="monitor-readiness-list" role="list">
              <div
                className="monitor-readiness-item"
                role="listitem"
              >
                <span>Base bed</span>
                <span
                  className={`monitor-readiness-state${
                    (baseMode === "track" && selectedTrackId) ||
                    (baseMode === "playlist" && selectedPlaylistId)
                      ? " ready"
                      : ""
                  }`}
                >
                  {(baseMode === "track" && selectedTrackId) ||
                  (baseMode === "playlist" && selectedPlaylistId)
                    ? selectedBaseLabel ?? "Armed"
                    : "Not selected"}
                </span>
              </div>
              <div className="monitor-readiness-item" role="listitem">
                <span>Source feed</span>
                <span
                  className={`monitor-readiness-state${selectedSource ? " ready" : ""}`}
                >
                  {selectedSource ? selectedSource.title : "Not selected"}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="action"
              onClick={handleCreateSession}
              disabled={
                creating ||
                mutating ||
                !selectedSourceId ||
                (baseMode === "track" ? !selectedTrackId : !selectedPlaylistId)
              }
            >
              <Plus size={14} />
              4. Run — {t.session.startSession}
            </button>
          </div>
        </section>

        <section className="panel session-list-panel">
          <div className="panel-header">
            <h3>{t.session.savedSessions}</h3>
            <p className="support-copy">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {activeSession && (
            <div
              className={`session-active-banner${playbackActive ? " session-active-banner--playback" : ""}`}
            >
              <div className="session-active-banner-copy">
                <div className="session-active-label">
                  {playbackActive ? <Radio size={14} /> : <Activity size={14} />}
                  <span>
                    {playbackActive ? "Replay active" : t.session.active}:{" "}
                    {activeSession.label || "—"}
                  </span>
                </div>
                {playbackActive ? (
                  <div className="session-progress-block">
                    <div
                      className="session-progress-track"
                      aria-label="Replay progress"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={playbackPercent ?? 0}
                    >
                      <span style={{ width: `${playbackPercent ?? 0}%` }} />
                    </div>
                    <p className="session-progress-copy">
                      {playbackPercent ?? 0}% complete · {activeSession.totalPolls} stored windows
                    </p>
                  </div>
                ) : (
                  <p className="session-progress-copy">
                    {activeSession.totalPolls} polls · {activeSession.totalLines} lines ·{" "}
                    {activeSession.totalAnomalies} anomalies
                  </p>
                )}
              </div>
              <button
                type="button"
                className="secondary-action"
                onClick={onStopSession}
                disabled={mutating}
              >
                <Pause size={14} />
                {playbackActive ? "Exit replay" : t.session.stopSession}
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
                const isPlaybackSession =
                  isActive && activeSessionMode === "playback";
                const sessionBookmarks = sessionBookmarksBySessionId[session.id] ?? [];

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
                        <span
                          className={`session-status-badge status-${session.status}${
                            isPlaybackSession ? " status-playback" : ""
                          }`}
                        >
                          {isPlaybackSession ? "Replay" : statusLabel(session.status)}
                        </span>
                      </div>
                      <p className="session-card-source">
                        {session.sourceTitle || session.sourceId || "Unknown source"}
                      </p>
                      {(session.playlistName || session.trackTitle) && (
                        <p className="session-card-base">
                          Base: {session.playlistName || session.trackTitle}
                        </p>
                      )}
                      {sessionBookmarks.length > 0 && (
                        <p className="session-card-bookmarks">
                          {sessionBookmarks.length} replay note
                          {sessionBookmarks.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    <div className="session-card-metrics">
                      <div className="session-metric">
                        <TrendingUp size={12} />
                        <span>
                          {session.totalPolls} {t.session.polls}
                        </span>
                      </div>
                      <div className="session-metric">
                        <Clock size={12} />
                        <span>
                          {session.totalLines} {t.session.lines}
                        </span>
                      </div>
                      <div className="session-metric">
                        <AlertCircle size={12} />
                        <span>
                          {session.totalAnomalies} {t.session.anomalies}
                        </span>
                      </div>
                    </div>

                    <p className="session-card-date">{formatShortDate(session.updatedAt)}</p>

                    <div className="session-card-actions">
                      {!isActive && session.totalPolls > 0 && (
                        <button
                          type="button"
                          className="action session-playback-action"
                          onClick={async () => {
                            setCreateError(null);
                            if (!session.sourcePath) {
                              setCreateError("This session has no stored source path for replay.");
                              return;
                            }

                            const success = await onPlayback(session);
                            if (!success) {
                              setCreateError("Maia could not start the session replay.");
                              return;
                            }

                            onSelectSession(session.id);
                          }}
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

          {selectedSession ? (
            <div className="session-bookmark-panel">
              <div className="panel-header compact">
                <div>
                  <h3>Replay notes</h3>
                  <p className="support-copy">
                    Marked windows for {selectedSession.label || "this session"}.
                  </p>
                </div>
              </div>
              {selectedSessionReplayFeedbackRecommendation ? (
                <ReplayFeedbackSummaryCard
                  recommendation={selectedSessionReplayFeedbackRecommendation}
                  title="Recommended mix"
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
                          <span>W{bookmark.replayWindowIndex}</span>
                        </div>
                        <p>
                          {bookmark.note || "Saved without note. Use as a replay marker."}
                        </p>
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
                      </div>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={async () => {
                          setCreateError(null);
                          const success = await onReplayBookmark(
                            selectedSession,
                            bookmark.replayWindowIndex,
                          );
                          if (!success) {
                            setCreateError("Maia could not jump to the saved replay note.");
                            return;
                          }
                          onSelectSession(selectedSession.id);
                        }}
                        disabled={mutating || selectedSession.totalPolls === 0}
                      >
                        <Radio size={12} />
                        Replay here
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state session-bookmark-empty">
                  <Radio size={24} style={{ opacity: 0.28 }} />
                  <p>No replay notes saved for this session yet.</p>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
