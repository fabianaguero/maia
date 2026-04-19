import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Trash2,
  Plus,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Radio,
} from "lucide-react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  LiveLogStreamUpdate,
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
import { getTrackTitle, resolvePlayableTrackPath } from "../../utils/track";
import { useMonitor } from "../monitor/MonitorContext";
import { getStreamAdapterLabel } from "../../utils/streamAdapter";

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

function formatMonitorConfidence(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function formatMonitorLevel(level: string | null | undefined): string {
  if (!level) {
    return "Awaiting input";
  }

  return level
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function resolveModeLabel(mode: QuickSessionMode): string {
  return mode === "log" ? "Log file" : "Repository";
}

function resolveBaseDetails(
  session: PersistedSession | null,
  tracks: LibraryTrack[],
  playlists: BaseTrackPlaylist[],
): { label: string | null; detail: string | null } {
  if (!session) {
    return { label: null, detail: null };
  }

  if (session.playlistId) {
    const playlist = playlists.find((entry) => entry.id === session.playlistId) ?? null;
    const label = playlist?.name ?? session.playlistName ?? null;
    const medianBpm = playlist ? getPlaylistMedianBpm(playlist, tracks) : null;

    return {
      label,
      detail: playlist
        ? `${playlist.trackIds.length} tracks · median ${medianBpm?.toFixed(0) ?? "?"} BPM`
        : null,
    };
  }

  if (session.trackId) {
    const track = tracks.find((entry) => entry.id === session.trackId) ?? null;
    const label = track ? getTrackTitle(track) : session.trackTitle ?? null;

    return {
      label,
      detail:
        typeof track?.analysis.bpm === "number"
          ? `${track.analysis.bpm.toFixed(0)} BPM`
          : null,
    };
  }

  return { label: null, detail: null };
}

function resolveSourceDetails(
  session: PersistedSession | null,
  repositories: RepositoryAnalysis[],
): { label: string | null; path: string | null } {
  if (!session) {
    return { label: null, path: null };
  }

  const repository =
    (session.sourceId
      ? repositories.find((entry) => entry.id === session.sourceId)
      : null) ??
    repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null;

  return {
    label: repository?.title ?? session.sourceTitle ?? null,
    path: repository?.sourcePath ?? session.sourcePath ?? null,
  };
}

function resolveSessionBedPath(
  session: PersistedSession | null,
  tracks: LibraryTrack[],
  playlists: BaseTrackPlaylist[],
): string | null {
  if (!session) {
    return null;
  }

  if (session.playlistId) {
    const playlist = playlists.find((entry) => entry.id === session.playlistId) ?? null;
    if (!playlist) {
      return null;
    }

    for (const trackId of playlist.trackIds) {
      const track = tracks.find((entry) => entry.id === trackId) ?? null;
      const path = track ? resolvePlayableTrackPath(track) : null;
      if (path) {
        return path;
      }
    }

    return null;
  }

  if (!session.trackId) {
    return null;
  }

  const track = tracks.find((entry) => entry.id === session.trackId) ?? null;
  return track ? resolvePlayableTrackPath(track) : null;
}

function resolveSessionBedUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (isTauri()) {
    return convertFileSrc(path);
  }

  return null;
}

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
  const monitor = useMonitor();
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
  const [latestUpdate, setLatestUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [directPath, setDirectPath] = useState("");
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const boothBedAudioRef = useRef<HTMLAudioElement | null>(null);

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
  const selectedBaseDetail =
    baseMode === "playlist"
      ? selectedPlaylist
        ? `${selectedPlaylist.trackIds.length} tracks · median ${selectedPlaylistBpm?.toFixed(0) ?? "?"} BPM`
        : null
      : selectedTrack
        ? `${selectedTrack.analysis.bpm?.toFixed(0) ?? "?"} BPM`
        : null;

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

      if (source.sourceKind !== "file") {
        setCreateError(
          "Live booth sessions currently support file-backed feeds only. Repository folders stay selectable in the UI, but need a dedicated live adapter before they can run.",
        );
        return;
      }

      const sessionId = `session_${Date.now()}`;
      const input: StartSessionInput = {
        sessionId,
        adapterKind: "file" as StreamAdapterKind,
        source: source.sourcePath,
        label: sessionLabel || source.title,
        startFromBeginning: true,
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

  const handleDirectLaunch = useCallback(async () => {
    if (!directPath.trim()) return;
    try {
      setIsDirectLoading(true);
      setCreateError(null);

      const input: StartSessionInput = {
        sessionId: `direct_${Date.now()}`,
        adapterKind: directPath.startsWith("ws") ? "websocket" : "file",
        source: directPath.trim(),
        label: directPath.split("/").pop() || "Direct Feed",
        startFromBeginning: !directPath.startsWith("ws"),
      };

      const success = await onStartSession(input, input.sessionId, {
        trackId: selectedTrackId ?? undefined,
        playlistId: selectedPlaylistId ?? undefined,
      });

      if (success) {
        setDirectPath("");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Direct launch failed");
    } finally {
      setIsDirectLoading(false);
    }
  }, [directPath, onStartSession, selectedTrackId, selectedPlaylistId]);

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
  const playbackActive = activeSessionMode === "playback" && Boolean(activeSession);
  const liveMonitorActive = Boolean(monitor.session) && !playbackActive;
  const activeBedUrl = resolveSessionBedUrl(
    liveMonitorActive && !playbackActive
      ? resolveSessionBedPath(activeSession ?? null, tracks, playlists)
      : null,
  );

  useEffect(() => {
    setLatestUpdate(null);
  }, [monitor.session?.sessionId]);

  useEffect(() => {
    return monitor.subscribe((update) => {
      setLatestUpdate(update);
    });
  }, [monitor.subscribe]);

  useEffect(() => {
    return () => {
      const audio = boothBedAudioRef.current;
      if (!audio) {
        return;
      }
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    let audio = boothBedAudioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.2;
      boothBedAudioRef.current = audio;
    }

    if (!activeBedUrl) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      return;
    }

    if (audio.src !== activeBedUrl) {
      audio.pause();
      audio.src = activeBedUrl;
      audio.currentTime = 0;
    }

    void audio.play().catch(() => {
      // Ignore autoplay failures; the next button interaction will retry.
    });
  }, [activeBedUrl]);
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
  const playbackPercent =
    typeof activePlaybackProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(activePlaybackProgress * 100)))
      : null;
  const readyToRun =
    Boolean(selectedSourceId) &&
    Boolean(baseMode === "track" ? selectedTrackId : selectedPlaylistId);
  const activeBaseDetails = resolveBaseDetails(activeSession ?? null, tracks, playlists);
  const selectedSessionBaseDetails = resolveBaseDetails(selectedSession, tracks, playlists);
  const activeSourceDetails = resolveSourceDetails(activeSession ?? null, repositories);
  const selectedSessionSourceDetails = resolveSourceDetails(selectedSession, repositories);
  const boothSourceLabel = liveMonitorActive
    ? activeSourceDetails.label ?? monitor.session?.repoTitle ?? null
    : selectedSource?.title ?? selectedSessionSourceDetails.label;
  const boothSourcePath = liveMonitorActive
    ? activeSourceDetails.path ?? monitor.session?.sourcePath ?? null
    : selectedSource?.sourcePath ?? selectedSessionSourceDetails.path;
  const boothBaseLabel = liveMonitorActive
    ? activeBaseDetails.label ?? null
    : selectedBaseLabel ?? selectedSessionBaseDetails.label;
  const boothBaseDetail = liveMonitorActive
    ? activeBaseDetails.detail
    : selectedBaseDetail ?? selectedSessionBaseDetails.detail;
  const boothAdapterLabel = monitor.session
    ? getStreamAdapterLabel(monitor.session.adapterKind)
    : resolveModeLabel(mode);
  const boothSignalBpm =
    latestUpdate?.suggestedBpm ??
    (liveMonitorActive ? activeSession?.lastBpm ?? null : selectedSource?.suggestedBpm ?? null);
  const boothState = playbackActive
    ? monitor.isPlaybackPaused
      ? { tone: "replay", label: "Replay paused" }
      : { tone: "replay", label: "Replay active" }
    : liveMonitorActive
      ? latestUpdate?.hasData
        ? { tone: "live", label: "Live hot" }
        : { tone: "armed", label: "Listening" }
      : readyToRun
        ? { tone: "armed", label: "Booth armed" }
        : { tone: "idle", label: "Booth idle" };
  const boothHeadline = playbackActive
    ? activeSession?.label || "Replay deck"
    : liveMonitorActive
      ? activeSession?.label || monitor.session?.repoTitle || "Live monitor"
      : boothSourceLabel || "Arm a live monitor";
  const boothSummary = playbackActive
    ? latestUpdate?.summary ||
      `${playbackPercent ?? 0}% of the saved session is back on deck.`
    : liveMonitorActive
      ? latestUpdate?.hasData
        ? latestUpdate.summary
        : "Maia is waiting for the next live window from the selected source."
      : readyToRun
        ? "Base bed and source feed are armed. Start the booth to begin capturing live windows."
        : "Choose a musical bed and a source feed to turn this lane into a live booth.";
  const levelCountEntries = Object.entries(latestUpdate?.levelCounts ?? {}).filter(
    ([, count]) => count > 0,
  );
  const topComponents = latestUpdate?.topComponents.slice(0, 5) ?? [];
  const warningItems = latestUpdate?.warnings.slice(0, 4) ?? [];
  const anomalyMarkers = latestUpdate?.anomalyMarkers.slice(0, 4) ?? [];
  const boothStats = playbackActive
    ? [
        {
          label: "Replay",
          value: `${monitor.playbackEventIndex ?? 0}/${monitor.playbackEventCount ?? activeSession?.totalPolls ?? 0}`,
          helper: "windows",
        },
        {
          label: "Progress",
          value: `${playbackPercent ?? 0}%`,
          helper: "complete",
        },
        {
          label: "Stored lines",
          value: `${activeSession?.totalLines ?? 0}`,
          helper: "captured",
        },
        {
          label: "Stored anomalies",
          value: `${activeSession?.totalAnomalies ?? 0}`,
          helper: "saved",
        },
        {
          label: "Signal BPM",
          value: boothSignalBpm ? `${boothSignalBpm.toFixed(0)}` : "—",
          helper: boothSignalBpm ? "bpm" : "waiting",
        },
        {
          label: "Confidence",
          value: formatMonitorConfidence(latestUpdate?.confidence),
          helper: "match",
        },
      ]
    : [
        {
          label: "Signal BPM",
          value: boothSignalBpm ? `${boothSignalBpm.toFixed(0)}` : "—",
          helper: boothSignalBpm ? "bpm" : "waiting",
        },
        {
          label: "Windows",
          value: `${monitor.metrics.windowCount}`,
          helper: "processed",
        },
        {
          label: "Lines",
          value: `${monitor.metrics.processedLines}`,
          helper: "streamed",
        },
        {
          label: "Anomalies",
          value: `${monitor.metrics.totalAnomalies}`,
          helper: "detected",
        },
        {
          label: "Dominant level",
          value: formatMonitorLevel(latestUpdate?.dominantLevel),
          helper: latestUpdate?.hasData ? "latest window" : "idle",
        },
        {
          label: "Confidence",
          value: formatMonitorConfidence(latestUpdate?.confidence),
          helper: "match",
        },
      ];

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

      <section className="panel session-booth-panel">
        <div className="session-booth-head">
          <div className="session-booth-head-copy">
            <span className={`session-booth-status-badge ${boothState.tone}`}>
              {boothState.label}
            </span>
            <p className="eyebrow">Live booth</p>
            <h3>{boothHeadline}</h3>
            <p className="support-copy">{boothSummary}</p>
          </div>

          <div className="session-booth-actions">
            {playbackActive ? (
              <>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => monitor.stepPlaybackWindow(-1)}
                  disabled={mutating}
                >
                  <SkipBack size={14} />
                  Prev window
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    monitor.isPlaybackPaused
                      ? monitor.resumePlayback()
                      : monitor.pausePlayback()
                  }
                  disabled={mutating}
                >
                  {monitor.isPlaybackPaused ? <Play size={14} /> : <Pause size={14} />}
                  {monitor.isPlaybackPaused ? "Resume replay" : "Pause replay"}
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => monitor.stepPlaybackWindow(1)}
                  disabled={mutating}
                >
                  <SkipForward size={14} />
                  Next window
                </button>
                <button
                  type="button"
                  className="action"
                  onClick={() => {
                    void onStopSession();
                  }}
                  disabled={mutating}
                >
                  <Pause size={14} />
                  Exit replay
                </button>
              </>
            ) : liveMonitorActive ? (
              <button
                type="button"
                className="action"
                onClick={() => {
                  void onStopSession();
                }}
                disabled={mutating}
              >
                <Pause size={14} />
                {t.session.stopSession}
              </button>
            ) : (
              <>
                <div className="direct-feed-input-group">
                   <input 
                    type="text" 
                    className="direct-feed-input"
                    placeholder="Paste log path or URL (e.g. /var/log/syslog)..."
                    value={directPath}
                    onChange={(e) => setDirectPath(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDirectLaunch()}
                   />
                   <button 
                    className="direct-launch-btn"
                    onClick={handleDirectLaunch}
                    disabled={isDirectLoading || !directPath.trim()}
                   >
                    {isDirectLoading ? "..." : "Launch"}
                   </button>
                </div>
                {selectedSession && selectedSession.status === "paused" && (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => {
                      void handleResumeSession(selectedSession.id);
                    }}
                    disabled={mutating}
                  >
                    <Play size={14} />
                    Resume selected
                  </button>
                )}
                {selectedSession && selectedSession.totalPolls > 0 && (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={async () => {
                      setCreateError(null);
                      if (!selectedSession.sourcePath) {
                        setCreateError("This session has no stored source path for replay.");
                        return;
                      }

                      const success = await onPlayback(selectedSession);
                      if (!success) {
                        setCreateError("Maia could not start the session replay.");
                        return;
                      }

                      onSelectSession(selectedSession.id);
                    }}
                    disabled={mutating}
                  >
                    <Radio size={14} />
                    Replay selected
                  </button>
                )}
                <button
                  type="button"
                  className="action"
                  onClick={handleCreateSession}
                  disabled={creating || mutating || !readyToRun}
                >
                  <Play size={14} />
                  {t.session.startSession}
                </button>
              </>
            )}
          </div>
        </div>

        {(playbackActive || liveMonitorActive) && (
          <div
            className="session-booth-progress"
            aria-label={playbackActive ? "Replay progress" : "Live monitoring activity"}
          >
            <span
              style={{
                width: playbackActive
                  ? `${playbackPercent ?? 0}%`
                  : `${Math.max(
                      12,
                      Math.min(
                        100,
                        latestUpdate?.hasData
                          ? latestUpdate.anomalyCount * 22 + latestUpdate.lineCount
                          : monitor.metrics.windowCount * 12,
                      ),
                    )}%`,
              }}
            />
          </div>
        )}

        <div className="session-booth-grid">
          <div className="session-booth-route">
            <div className="session-booth-route-item">
              <span>Source feed</span>
              <strong>{boothSourceLabel ?? "Not selected"}</strong>
              <small>{boothSourcePath ?? "Pick a log file or repository to monitor."}</small>
            </div>
            <div className="session-booth-route-item">
              <span>Base bed</span>
              <strong>{boothBaseLabel ?? "Not armed"}</strong>
              <small>{boothBaseDetail ?? "Track or playlist will sit under the live data."}</small>
            </div>
            <div className="session-booth-route-item">
              <span>Adapter</span>
              <strong>{boothAdapterLabel}</strong>
              <small>
                {monitor.session
                  ? `Session ${monitor.session.sessionId}`
                  : `Ready to launch in ${resolveModeLabel(mode).toLowerCase()} mode.`}
              </small>
            </div>
          </div>

          <div className="session-booth-stat-grid">
            {boothStats.map((item) => (
              <article key={item.label} className="session-booth-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.helper}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="session-booth-detail-grid">
          <section className="session-booth-card">
            <div className="session-booth-card-header">
              <strong>Signal snapshot</strong>
              <span>
                {latestUpdate?.hasData
                  ? `${latestUpdate.lineCount} lines in latest window`
                  : "Waiting for stream data"}
              </span>
            </div>
            <div className="session-signal-chip-row">
              {levelCountEntries.length > 0 ? (
                levelCountEntries.map(([level, count]) => (
                  <span key={level} className="session-signal-chip">
                    {formatMonitorLevel(level)} · {count}
                  </span>
                ))
              ) : (
                <span className="session-signal-chip muted">No level breakdown yet</span>
              )}
            </div>
            <div className="session-signal-chip-row">
              {topComponents.length > 0 ? (
                topComponents.map((component) => (
                  <span key={component.component} className="session-signal-chip">
                    {component.component} · {component.count}
                  </span>
                ))
              ) : (
                <span className="session-signal-chip muted">Top components will appear here</span>
              )}
            </div>
          </section>

          <section className="session-booth-card">
            <div className="session-booth-card-header">
              <strong>{playbackActive ? "Replay notes" : "Watchouts"}</strong>
              <span>
                {latestUpdate?.anomalyCount
                  ? `${latestUpdate.anomalyCount} anomalies in latest window`
                  : "No current anomaly burst"}
              </span>
            </div>
            {warningItems.length > 0 || anomalyMarkers.length > 0 ? (
              <div className="session-booth-list">
                {warningItems.map((warning) => (
                  <div key={warning} className="session-booth-list-item">
                    <AlertCircle size={14} />
                    <span>{warning}</span>
                  </div>
                ))}
                {anomalyMarkers.map((marker) => (
                  <div
                    key={`${marker.eventIndex}-${marker.component}-${marker.excerpt}`}
                    className="session-booth-list-item"
                  >
                    <TrendingUp size={14} />
                    <span>
                      {formatMonitorLevel(marker.level)} · {marker.component} · {marker.excerpt}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="session-booth-list-item muted">
                <Activity size={14} />
                <span>
                  {readyToRun
                    ? "Run the booth to start collecting warnings, anomaly markers, and playback notes."
                    : "The booth will surface warnings and anomaly markers once a source is active."}
                </span>
              </div>
            )}
          </section>
        </div>
      </section>

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
                          {isActive && !isPlaybackSession
                            ? monitor.metrics.windowCount
                            : session.totalPolls}{" "}
                          {t.session.polls}
                        </span>
                      </div>
                      <div className="session-metric">
                        <Clock size={12} />
                        <span>
                          {isActive && !isPlaybackSession
                            ? monitor.metrics.processedLines
                            : session.totalLines}{" "}
                          {t.session.lines}
                        </span>
                      </div>
                      <div className="session-metric">
                        <AlertCircle size={12} />
                        <span>
                          {isActive && !isPlaybackSession
                            ? monitor.metrics.totalAnomalies
                            : session.totalAnomalies}{" "}
                          {t.session.anomalies}
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
