import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
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
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import { SessionScreenHeader } from "./SessionScreenHeader";
import { SessionScreenNoticeStack } from "./SessionScreenNoticeStack";
import { SessionScreenPanels } from "./SessionScreenPanels";
import {
  buildSessionLabelPlaceholder,
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
  createSessionTimestampId,
  resolveBookmarkContext,
  resolvePlaybackPercent,
  resolveReadyToRun,
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
  resolveSelectedEntities,
  resolveSourceOptions,
  type SessionBookmarkContext,
  type SessionStartDraft,
} from "./sessionScreenRuntime";

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

  const sourceOptions = useMemo(() => resolveSourceOptions(mode, repositories), [mode, repositories]);
  const { selectedSource, selectedTrack, selectedPlaylist } = useMemo(
    () =>
      resolveSelectedEntities({
        playlists,
        repositories,
        selectedPlaylistId,
        selectedSourceId,
        selectedTrackId,
        tracks,
      }),
    [playlists, repositories, selectedPlaylistId, selectedSourceId, selectedTrackId, tracks],
  );
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
      const plan = createSessionStartPlan(
        {
          baseMode,
          mode,
          repositories,
          selectedPlaylistId,
          selectedSourceId,
          selectedTrackId,
          sessionLabel,
        },
        t,
        () => createSessionTimestampId("session"),
      );

      if (plan.error || !plan.input || !plan.sessionId) {
        if (plan.error) {
          setCreateError(plan.error);
        }
        return;
      }

      const success = await onStartSession(plan.input, plan.sessionId, plan.draft);

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
      const plan = createDirectSessionStartPlan(
        {
          directPath,
          selectedPlaylistId,
          selectedTrackId,
        },
        t,
        () => createSessionTimestampId("direct"),
      );

      if (!plan.input || !plan.sessionId) {
        return;
      }

      const success = await onStartSession(plan.input, plan.sessionId, plan.draft);

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
        const plan = createResumeSessionPlan(sessionId, sessions, repositories, t);
        if (!plan.input || !plan.sessionId) {
          if (plan.error) {
            setCreateError(plan.error);
          }
          return;
        }

        const success = await onStartSession(plan.input, plan.sessionId, plan.draft);
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

  const handlePlaybackSession = useCallback(
    async (session: PersistedSession) => {
      setCreateError(null);
      const replayError = resolveReplaySessionError(session, t);
      if (replayError) {
        setCreateError(replayError);
        return;
      }

      const success = await onPlayback(session);
      const replayFailure = resolveReplaySessionFailure(success, t);
      if (replayFailure) {
        setCreateError(replayFailure);
        return;
      }

      onSelectSession(session.id);
    },
    [onPlayback, onSelectSession, t],
  );

  const handleReplayBookmark = useCallback(
    async (session: PersistedSession, replayWindowIndex: number) => {
      setCreateError(null);
      const success = await onReplayBookmark(session, replayWindowIndex);
      const replayError = resolveReplayBookmarkError(success, t);
      if (replayError) {
        setCreateError(replayError);
        return;
      }
      onSelectSession(session.id);
    },
    [onReplayBookmark, onSelectSession, t],
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
  const sessionLabelPlaceholder = buildSessionLabelPlaceholder({
    selectedBaseLabel: selectedBaseDetails.label,
    selectedSourceTitle: selectedSource?.title ?? null,
    templateGenre: selectedTemplatePresentation?.genre ?? selectedTemplate?.genre ?? null,
    templateLabel: selectedTemplatePresentation?.label ?? selectedTemplate?.label ?? null,
    fallbackLabel: t.session.sessionPlaceholder,
  });
  const playbackPercent = resolvePlaybackPercent(activePlaybackProgress);
  const readyToRun = resolveReadyToRun({
    baseMode,
    selectedPlaylistId,
    selectedSourceId,
    selectedTrackId,
  });
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
      <SessionScreenHeader sessionsCount={sessions.length} activeSession={activeSession ?? null} />

      <SessionScreenNoticeStack error={error} createError={createError} />

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
          await handlePlaybackSession(selectedSession);
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

      <SessionScreenPanels
        tracks={tracks}
        playlists={playlists}
        sessions={sessions}
        loading={loading}
        mutating={mutating}
        selectedSessionId={selectedSessionId}
        activeSessionId={activeSessionId}
        activeSessionMode={activeSessionMode}
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
        sourceOptions={sourceOptions}
        selectedSession={selectedSession}
        selectedSessionBookmarks={selectedSessionBookmarks}
        selectedSessionReplayFeedbackRecommendation={selectedSessionReplayFeedbackRecommendation}
        sessionBookmarksBySessionId={sessionBookmarksBySessionId}
        bookmarkContexts={bookmarkContexts}
        liveWindowCount={monitor.metrics.windowCount}
        liveProcessedLines={monitor.metrics.processedLines}
        liveTotalAnomalies={monitor.metrics.totalAnomalies}
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
        onSelectSession={onSelectSession}
        onResumeSession={(sessionId) => {
          void handleResumeSession(sessionId);
        }}
        onPlaybackSession={handlePlaybackSession}
        onReplayBookmark={handleReplayBookmark}
        onDeleteSession={(sessionId) => {
          void onDelete(sessionId);
        }}
      />
    </section>
  );
}
