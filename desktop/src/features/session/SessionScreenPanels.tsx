import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import { SessionSavedSessionsPanel } from "./SessionSavedSessionsPanel";
import { SessionSetupPanel } from "./SessionSetupPanel";

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
  return (
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
        selectedBaseLabel={selectedBaseLabel}
        selectedBaseDetail={selectedBaseDetail}
        sessionLabel={sessionLabel}
        sessionLabelPlaceholder={sessionLabelPlaceholder}
        creating={creating}
        mutating={mutating}
        onTemplateSelect={onTemplateSelect}
        onBaseModeChange={onBaseModeChange}
        onTrackSelect={onTrackSelect}
        onPlaylistSelect={onPlaylistSelect}
        onModeChange={onModeChange}
        onSourceSelect={onSourceSelect}
        onSessionLabelChange={onSessionLabelChange}
        onCreateSession={onCreateSession}
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
        liveWindowCount={liveWindowCount}
        liveProcessedLines={liveProcessedLines}
        liveTotalAnomalies={liveTotalAnomalies}
        onSelectSession={onSelectSession}
        onResumeSession={onResumeSession}
        onPlaybackSession={onPlaybackSession}
        onReplayBookmark={onReplayBookmark}
        onDeleteSession={onDeleteSession}
      />
    </div>
  );
}
