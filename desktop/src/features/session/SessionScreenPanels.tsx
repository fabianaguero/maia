import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import { SessionSavedSessionsPanel } from "./SessionSavedSessionsPanel";
import { SessionSetupPanel } from "./SessionSetupPanel";
import {
  buildSessionSavedSessionsPanelProps,
  buildSessionSetupPanelProps,
} from "./sessionScreenPanelsViewRuntime";

interface SessionScreenPanelsProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  mode: QuickSessionMode;
  baseMode: SessionBaseMode;
  selectedTemplateId: string;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  sessionLabel: string;
  sessionLabelPlaceholder: string;
  creating: boolean;
  sourceOptions: RepositoryAnalysis[];
  selectedSession: PersistedSession | null;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onTemplateSelect: (templateId: string) => void;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string | null) => void;
  onPlaylistSelect: (playlistId: string | null) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string | null) => void;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void;
  onPlaybackSession: (session: PersistedSession) => Promise<void>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<void>;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionScreenPanels({
  tracks,
  playlists,
  sessions,
  loading,
  mutating,
  selectedSessionId,
  activeSessionId,
  activeSessionMode,
  mode,
  baseMode,
  selectedTemplateId,
  selectedSourceId,
  selectedTrackId,
  selectedPlaylistId,
  selectedSource,
  selectedTrack,
  selectedPlaylist,
  selectedBaseLabel,
  selectedBaseDetail,
  sessionLabel,
  sessionLabelPlaceholder,
  creating,
  sourceOptions,
  selectedSession,
  selectedSessionBookmarks,
  selectedSessionReplayFeedbackRecommendation,
  sessionBookmarksBySessionId,
  bookmarkContexts,
  liveWindowCount,
  liveProcessedLines,
  liveTotalAnomalies,
  onTemplateSelect,
  onBaseModeChange,
  onTrackSelect,
  onPlaylistSelect,
  onModeChange,
  onSourceSelect,
  onSessionLabelChange,
  onCreateSession,
  onSelectSession,
  onResumeSession,
  onPlaybackSession,
  onReplayBookmark,
  onDeleteSession,
}: SessionScreenPanelsProps) {
  const setupPanelProps = buildSessionSetupPanelProps({
    tracks,
    playlists,
    sourceOptions,
    mode,
    baseMode,
    selectedTemplateId,
    selectedSourceId,
    selectedTrackId,
    selectedPlaylistId,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseLabel,
    selectedBaseDetail,
    sessionLabel,
    sessionLabelPlaceholder,
    creating,
    mutating,
    onTemplateSelect,
    onBaseModeChange,
    onTrackSelect,
    onPlaylistSelect,
    onModeChange,
    onSourceSelect,
    onSessionLabelChange,
    onCreateSession,
  });
  const savedSessionsPanelProps = buildSessionSavedSessionsPanelProps({
    sessions,
    loading,
    mutating,
    selectedSessionId,
    selectedSession,
    selectedSessionBookmarks,
    selectedSessionReplayFeedbackRecommendation,
    sessionBookmarksBySessionId,
    bookmarkContexts,
    activeSessionId,
    activeSessionMode,
    liveWindowCount,
    liveProcessedLines,
    liveTotalAnomalies,
    onSelectSession,
    onResumeSession,
    onPlaybackSession,
    onReplayBookmark,
    onDeleteSession,
  });

  return (
    <div className="session-layout">
      <SessionSetupPanel {...setupPanelProps} />

      <SessionSavedSessionsPanel {...savedSessionsPanelProps} />
    </div>
  );
}
