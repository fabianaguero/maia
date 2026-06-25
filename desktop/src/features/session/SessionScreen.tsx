import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
} from "../../types/library";
import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import { listSessionEvents } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import {
  SOURCE_TEMPLATES,
  DEFAULT_SOURCE_TEMPLATE_ID,
  resolveSourceTemplatePresentation,
} from "../../config/sourceTemplates";
import { useReplayFeedbackRecommendation } from "../../hooks/useReplayFeedbackRecommendation";
import { useMonitor } from "../monitor/MonitorContext";
import {
  resolveBaseDetails,
  resolveSelectedBaseDetails,
  resolveSessionBedPath,
  resolveSessionBedUrl,
  resolveSourceDetails,
  type QuickSessionMode,
  type SessionBaseMode,
} from "./sessionDisplay";
import { SessionBoothPanel } from "./SessionBoothPanel";
import { SessionSetupPanel } from "./SessionSetupPanel";
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import {
  SessionSavedSessionsPanel,
  type SessionBookmarkContext,
} from "./SessionSavedSessionsPanel";

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
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onDelete: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
}

function resolveBookmarkContext(
  bookmark: SessionBookmark,
  events: SessionEvent[],
): SessionBookmarkContext {
  if (!events || bookmark.eventIndex == null) {
    return {
      bpm: null,
      dominantLevel: null,
      anomalyCount: null,
      logExcerpt: null,
    };
  }

  const event = events[bookmark.eventIndex];
  if (!event) {
    return {
      bpm: null,
      dominantLevel: null,
      anomalyCount: null,
      logExcerpt: null,
    };
  }

  let logExcerpt: string | null = null;
  try {
    const parsedLines = JSON.parse(event.parsedLinesJson) as string[];
    if (parsedLines && parsedLines.length > 0) {
      logExcerpt = parsedLines[0].slice(0, 120) || null;
    }
  } catch {
    // Silent fail on JSON parse
  }

  return {
    bpm: event.suggestedBpm,
    dominantLevel: event.dominantLevel,
    anomalyCount: event.anomalyCount,
    logExcerpt,
  };
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_SOURCE_TEMPLATE_ID);
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<SessionEvent[]>([]);
  const boothBedAudioRef = useRef<HTMLAudioElement | null>(null);
  const subscribeToMonitor = monitor.subscribe;

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
  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const selectedBaseDetails = resolveSelectedBaseDetails(
    baseMode,
    selectedTrack,
    selectedPlaylist,
    tracks,
  );

  const handleCreateSession = useCallback(async () => {
    try {
      setCreateError(null);
      setCreating(true);

      if (!selectedSourceId) {
        setCreateError(mode === "log" ? t.session.selectLogSource : t.session.selectRepoSource);
        return;
      }

      if (baseMode === "track" && !selectedTrackId) {
        setCreateError(t.session.selectBaseTrack);
        return;
      }

      if (baseMode === "playlist" && !selectedPlaylistId) {
        setCreateError(t.session.selectBasePlaylist);
        return;
      }

      const source = repositories.find((entry) => entry.id === selectedSourceId);
      if (!source) {
        setCreateError(t.session.sourceNotFound);
        return;
      }

      if (source.sourceKind !== "file") {
        setCreateError(t.session.fileOnlyLiveBooth);
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
        trackId: baseMode === "track" ? (selectedTrackId ?? undefined) : undefined,
        playlistId: baseMode === "playlist" ? (selectedPlaylistId ?? undefined) : undefined,
      });

      if (success) {
        setSessionLabel("");
        setSelectedSourceId(null);
        setSelectedTrackId(null);
        setSelectedPlaylistId(null);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.session.failedCreateSession);
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
    t,
  ]);

  const handleDirectLaunch = useCallback(async () => {
    if (!directPath.trim()) return;
    try {
      setIsDirectLoading(true);
      setCreateError(null);

      const input: StartSessionInput = {
        sessionId: `direct_${Date.now()}`,
        adapterKind: "file",
        source: directPath.trim(),
        label: directPath.split("/").pop() || t.session.directFeed,
        startFromBeginning: true,
      };

      const success = await onStartSession(input, input.sessionId, {
        trackId: selectedTrackId ?? undefined,
        playlistId: selectedPlaylistId ?? undefined,
      });

      if (success) {
        setDirectPath("");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.session.failedCreateSession);
    } finally {
      setIsDirectLoading(false);
    }
  }, [directPath, onStartSession, selectedPlaylistId, selectedTrackId, t]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      try {
        setCreateError(null);
        const session = sessions.find((entry) => entry.id === sessionId);
        if (!session) {
          return;
        }

        // Resolve source: prefer by id, fall back to path match, then use stored path directly
        const source =
          repositories.find((r) => r.id === session.sourceId) ??
          repositories.find(
            (r) => session.sourcePath !== null && r.sourcePath === session.sourcePath,
          ) ??
          null;

        const sourcePath = source?.sourcePath ?? session.sourcePath;
        if (!sourcePath) {
          setCreateError(t.session.noStoredSourceResume);
          return;
        }
        if ((session.adapterKind || "file") !== "file") {
          setCreateError(t.session.unsupportedAdapterResume);
          return;
        }

        const input: StartSessionInput = {
          sessionId: session.id,
          adapterKind: "file",
          source: sourcePath,
          label: session.label || source?.title || session.sourceTitle || t.session.resumedSession,
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
        setCreateError(err instanceof Error ? err.message : t.session.failedResumeSession);
      }
    },
    [onResume, onSelectSession, onStartSession, repositories, sessions, t],
  );

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    activeSession ??
    sessions[0] ??
    null;
  const selectedSessionIdForEvents = selectedSession?.id ?? null;
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
    return subscribeToMonitor((update) => {
      setLatestUpdate(update);
    });
  }, [subscribeToMonitor]);

  useEffect(() => {
    if (!selectedSessionIdForEvents) {
      setSelectedSessionEvents([]);
      return;
    }

    const loadEvents = async () => {
      try {
        const events = await listSessionEvents(selectedSessionIdForEvents);
        setSelectedSessionEvents(events);
      } catch {
        // Silent fail on event load
        setSelectedSessionEvents([]);
      }
    };

    void loadEvents();
  }, [selectedSessionIdForEvents]);

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
  const selectedSessionBookmarks = useMemo(
    () => (selectedSession ? (sessionBookmarksBySessionId[selectedSession.id] ?? []) : []),
    [selectedSession, sessionBookmarksBySessionId],
  );
  const bookmarkContexts = useMemo(() => {
    const contexts: Record<number, SessionBookmarkContext> = {};
    for (const bookmark of selectedSessionBookmarks) {
      contexts[bookmark.id] = resolveBookmarkContext(bookmark, selectedSessionEvents);
    }
    return contexts;
  }, [selectedSessionBookmarks, selectedSessionEvents]);
  const selectedSessionReplayFeedbackRecommendation =
    useReplayFeedbackRecommendation(selectedSessionBookmarks);
  const selectedTemplate =
    SOURCE_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedTemplatePresentation = selectedTemplate
    ? resolveSourceTemplatePresentation(selectedTemplate, t)
    : null;
  const sessionLabelPlaceholder =
    selectedSource && selectedBaseDetails.label
      ? `${selectedSource.title} · ${selectedBaseDetails.label} · ${selectedTemplatePresentation?.genre ?? selectedTemplate?.genre ?? ""}`
      : (selectedTemplatePresentation?.label ??
        selectedTemplate?.label ??
        t.session.sessionPlaceholder);
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
  const booth = buildSessionBoothViewModel({
    t,
    mode,
    latestUpdate,
    playbackActive,
    liveMonitorActive,
    readyToRun,
    playbackPercent,
    activeSession: activeSession ?? null,
    selectedSourceTitle: selectedSource?.title ?? null,
    selectedSourcePath: selectedSource?.sourcePath ?? null,
    selectedSourceSuggestedBpm: selectedSource?.suggestedBpm ?? null,
    selectedSessionSourceLabel: selectedSessionSourceDetails.label,
    selectedSessionSourcePath: selectedSessionSourceDetails.path,
    selectedBaseLabel: selectedBaseDetails.label,
    selectedBaseDetail: selectedBaseDetails.detail,
    selectedSessionBaseLabel: selectedSessionBaseDetails.label,
    selectedSessionBaseDetail: selectedSessionBaseDetails.detail,
    activeBaseLabel: activeBaseDetails.label,
    activeBaseDetail: activeBaseDetails.detail,
    activeSourceLabel: activeSourceDetails.label,
    activeSourcePath: activeSourceDetails.path,
    monitorSession: monitor.session,
    monitorMetrics: monitor.metrics,
    isPlaybackPaused: monitor.isPlaybackPaused,
    playbackEventIndex: monitor.playbackEventIndex,
    playbackEventCount: monitor.playbackEventCount,
  });

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

      <SessionBoothPanel
        booth={booth}
        playbackActive={playbackActive}
        liveMonitorActive={liveMonitorActive}
        mutating={mutating}
        readyToRun={readyToRun}
        mode={mode}
        latestUpdate={latestUpdate}
        monitorSessionId={monitor.session?.sessionId ?? null}
        isPlaybackPaused={monitor.isPlaybackPaused}
        directPath={directPath}
        isDirectLoading={isDirectLoading}
        selectedSession={selectedSession}
        creating={creating}
        onDirectPathChange={setDirectPath}
        onDirectLaunch={handleDirectLaunch}
        onResumeSelected={() => {
          if (selectedSession) {
            void handleResumeSession(selectedSession.id);
          }
        }}
        onReplaySelected={async () => {
          setCreateError(null);
          if (!selectedSession?.sourcePath) {
            setCreateError(t.session.noStoredSourceReplay);
            return;
          }
          const success = await onPlayback(selectedSession);
          if (!success) {
            setCreateError(t.session.failedReplay);
            return;
          }
          onSelectSession(selectedSession.id);
        }}
        onCreateSession={handleCreateSession}
        onStepPlaybackWindow={(direction) => monitor.stepPlaybackWindow(direction)}
        onToggleReplayPlayback={() =>
          monitor.isPlaybackPaused ? monitor.resumePlayback() : monitor.pausePlayback()
        }
        onStopSession={() => {
          void onStopSession();
        }}
      />

      <div className="session-layout">
        <SessionSetupPanel
          tracks={tracks}
          playlists={playlists}
          sourceOptions={sourceOptions}
          mode={mode}
          baseMode={baseMode}
          selectedTemplateId={selectedTemplateId}
          selectedSourceId={selectedSourceId}
          selectedTrackId={selectedTrackId}
          selectedPlaylistId={selectedPlaylistId}
          selectedSource={selectedSource}
          selectedTrack={selectedTrack}
          selectedPlaylist={selectedPlaylist}
          selectedBaseLabel={selectedBaseDetails.label}
          selectedBaseDetail={selectedBaseDetails.detail}
          sessionLabel={sessionLabel}
          sessionLabelPlaceholder={sessionLabelPlaceholder}
          creating={creating}
          mutating={mutating}
          onTemplateSelect={setSelectedTemplateId}
          onBaseModeChange={setBaseMode}
          onTrackSelect={setSelectedTrackId}
          onPlaylistSelect={setSelectedPlaylistId}
          onModeChange={(nextMode) => {
            setMode(nextMode);
            setSelectedSourceId(null);
          }}
          onSourceSelect={setSelectedSourceId}
          onSessionLabelChange={setSessionLabel}
          onCreateSession={handleCreateSession}
        />

        <SessionSavedSessionsPanel
          sessions={sessions}
          loading={loading}
          mutating={mutating}
          selectedSessionId={selectedSessionId}
          selectedSession={selectedSession}
          selectedSessionBookmarks={selectedSessionBookmarks}
          selectedSessionReplayFeedbackRecommendation={selectedSessionReplayFeedbackRecommendation}
          sessionBookmarksBySessionId={sessionBookmarksBySessionId}
          bookmarkContexts={bookmarkContexts}
          activeSessionId={activeSessionId}
          activeSessionMode={activeSessionMode}
          liveWindowCount={monitor.metrics.windowCount}
          liveProcessedLines={monitor.metrics.processedLines}
          liveTotalAnomalies={monitor.metrics.totalAnomalies}
          onSelectSession={onSelectSession}
          onResumeSession={(sessionId) => {
            void handleResumeSession(sessionId);
          }}
          onPlaybackSession={async (session) => {
            setCreateError(null);
            if (!session.sourcePath) {
              setCreateError(t.session.noStoredSourceReplay);
              return;
            }

            const success = await onPlayback(session);
            if (!success) {
              setCreateError(t.session.failedReplay);
              return;
            }

            onSelectSession(session.id);
          }}
          onReplayBookmark={async (session, replayWindowIndex) => {
            setCreateError(null);
            const success = await onReplayBookmark(session, replayWindowIndex);
            if (!success) {
              setCreateError(t.session.failedReplayJump);
              return;
            }
            onSelectSession(session.id);
          }}
          onDeleteSession={(sessionId) => {
            void onDelete(sessionId);
          }}
        />
      </div>
    </section>
  );
}
