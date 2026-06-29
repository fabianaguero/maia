import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { SessionBoothPanel } from "./SessionBoothPanel";
import { SessionScreenHeader } from "./SessionScreenHeader";
import { SessionScreenNoticeStack } from "./SessionScreenNoticeStack";
import { SessionScreenPanels } from "./SessionScreenPanels";
import type { SessionStartDraft } from "./sessionScreenRuntime";
import { buildSessionScreenViewModel } from "./sessionScreenViewModel";
import { useSessionScreenController } from "./useSessionScreenController";

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
  const controller = useSessionScreenController({
    tracks,
    playlists,
    repositories,
    sessions,
    sessionBookmarksBySessionId,
    selectedSessionId,
    activeSessionId,
    activeSessionMode,
    activePlaybackProgress,
    onStartSession,
    onResume,
    onPlayback,
    onReplayBookmark,
    onSelectSession,
  });

  const viewModel = buildSessionScreenViewModel({
    tracks,
    playlists,
    sessions,
    sessionsCount: sessions.length,
    selectedSessionId,
    loading,
    mutating,
    error,
    activeSessionId,
    activeSessionMode,
    sessionBookmarksBySessionId,
    onStopSession,
    onDelete,
    onSelectSession,
    controller,
  });

  return (
    <section className="screen">
      <SessionScreenHeader {...viewModel.headerProps} />

      <SessionScreenNoticeStack {...viewModel.noticeProps} />

      <SessionBoothPanel {...viewModel.boothProps} />

      <SessionScreenPanels {...viewModel.panelsProps} />
    </section>
  );
}
