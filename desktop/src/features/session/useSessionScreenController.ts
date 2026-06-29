import { useMemo, useRef, useState } from "react";

import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import {
  DEFAULT_SOURCE_TEMPLATE_ID,
  resolveSourceTemplatePresentation,
  SOURCE_TEMPLATES,
} from "../../config/sourceTemplates";
import { useReplayFeedbackRecommendation } from "../../hooks/useReplayFeedbackRecommendation";
import { useT } from "../../i18n/I18nContext";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import { useMonitor } from "../monitor/MonitorContext";
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import { type QuickSessionMode, type SessionBaseMode } from "./sessionDisplay";
import {
  resolveSessionControllerDerivedState,
  type SessionStartDraft,
} from "./sessionScreenRuntime";
import { useSessionScreenActions } from "./useSessionScreenActions";
import { useSessionScreenEffects } from "./useSessionScreenEffects";

interface SessionScreenControllerInput {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  activePlaybackProgress: number | null;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onResume: (sessionId: string) => void;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
}

export function useSessionScreenController(input: SessionScreenControllerInput) {
  const t = useT();
  const monitor = useMonitor();
  const subscribeToMonitor = monitor.subscribe;
  const [mode, setMode] = useState<QuickSessionMode>("log");
  const [baseMode, setBaseMode] = useState<SessionBaseMode>(
    input.tracks.length > 0 ? "track" : "playlist",
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

  const {
    handleCreateSession,
    handleDirectLaunch,
    handleResumeSession,
    handlePlaybackSession,
    handleReplayBookmark,
  } = useSessionScreenActions({
    t,
    baseMode,
    mode,
    repositories: input.repositories,
    sessions: input.sessions,
    selectedPlaylistId,
    selectedSourceId,
    selectedTrackId,
    sessionLabel,
    directPath,
    onStartSession: input.onStartSession,
    onResume: input.onResume,
    onPlayback: input.onPlayback,
    onReplayBookmark: input.onReplayBookmark,
    onSelectSession: input.onSelectSession,
    setCreateError,
    setCreating,
    setIsDirectLoading,
    setSessionLabel,
    setSelectedSourceId,
    setSelectedTrackId,
    setSelectedPlaylistId,
    setDirectPath,
  });

  const selectedTemplate =
    SOURCE_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedTemplatePresentation = selectedTemplate
    ? resolveSourceTemplatePresentation(selectedTemplate, t)
    : null;
  const derivedState = useMemo(
    () =>
      resolveSessionControllerDerivedState({
        activePlaybackProgress: input.activePlaybackProgress,
        activeSessionId: input.activeSessionId,
        activeSessionMode: input.activeSessionMode,
        baseMode,
        mode,
        monitorHasSession: Boolean(monitor.session),
        playlists: input.playlists,
        repositories: input.repositories,
        selectedPlaylistId,
        selectedSessionEvents,
        selectedSessionId: input.selectedSessionId,
        selectedSourceId,
        selectedTrackId,
        sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
        sessionPlaceholderFallback: t.session.sessionPlaceholder,
        templateGenre: selectedTemplatePresentation?.genre ?? selectedTemplate?.genre ?? null,
        templateLabel: selectedTemplatePresentation?.label ?? selectedTemplate?.label ?? null,
        sessions: input.sessions,
        tracks: input.tracks,
      }),
    [
      input.activePlaybackProgress,
      input.activeSessionId,
      input.activeSessionMode,
      input.playlists,
      input.repositories,
      input.selectedSessionId,
      input.sessionBookmarksBySessionId,
      input.sessions,
      input.tracks,
      baseMode,
      mode,
      monitor.session,
      selectedPlaylistId,
      selectedSessionEvents,
      selectedSourceId,
      selectedTemplate?.genre,
      selectedTemplate?.label,
      selectedTemplatePresentation?.genre,
      selectedTemplatePresentation?.label,
      selectedTrackId,
      t.session.sessionPlaceholder,
    ],
  );
  const {
    sourceOptions,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseDetails,
    activeSession,
    selectedSession,
    selectedSessionIdForEvents,
    playbackActive,
    liveMonitorActive,
    activeBedUrl,
    selectedSessionBookmarks,
    bookmarkContexts,
    sessionLabelPlaceholder,
    playbackPercent,
    readyToRun,
    activeBaseDetails,
    selectedSessionBaseDetails,
    activeSourceDetails,
    selectedSessionSourceDetails,
  } = derivedState;
  useSessionScreenEffects({
    monitorSessionId: monitor.session?.sessionId ?? null,
    subscribeToMonitor,
    setLatestUpdate,
    selectedSessionIdForEvents,
    setSelectedSessionEvents,
    activeBedUrl,
    boothBedAudioRef,
  });
  const selectedSessionReplayFeedbackRecommendation =
    useReplayFeedbackRecommendation(selectedSessionBookmarks);
  const booth = buildSessionBoothViewModel({
    t,
    mode,
    latestUpdate,
    playbackActive,
    liveMonitorActive,
    readyToRun,
    playbackPercent,
    activeSession,
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

  return {
    t,
    monitor,
    mode,
    setMode,
    baseMode,
    setBaseMode,
    selectedSourceId,
    setSelectedSourceId,
    selectedTrackId,
    setSelectedTrackId,
    selectedPlaylistId,
    setSelectedPlaylistId,
    sessionLabel,
    setSessionLabel,
    creating,
    createError,
    latestUpdate,
    directPath,
    setDirectPath,
    isDirectLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    sourceOptions,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseDetails,
    handleCreateSession,
    handleDirectLaunch,
    handleResumeSession,
    handlePlaybackSession,
    handleReplayBookmark,
    activeSession,
    selectedSession,
    playbackActive,
    liveMonitorActive,
    selectedSessionBookmarks,
    bookmarkContexts,
    selectedSessionReplayFeedbackRecommendation,
    sessionLabelPlaceholder,
    readyToRun,
    booth,
  };
}
