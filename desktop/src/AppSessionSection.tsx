import type { PersistedSession, SessionBookmark } from "./api/sessions";
import { SessionScreen } from "./features/session/SessionScreen";
import type { SessionStartDraft } from "./features/session/sessionScreenRuntime";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "./types/library";
import type { StartSessionInput } from "./types/monitor";
import type { ActiveMonitorSession } from "./features/monitor/monitorContextTypes";

interface AppSessionSectionProps {
  monitorSession: ActiveMonitorSession | null;
  monitorIsPlayback: boolean;
  monitorPlaybackProgress: number | null;
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionId: string | null;
  sessionsLoading: boolean;
  sessionsMutating: boolean;
  sessionsError: string | null;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onStopSession: () => Promise<void>;
  onResumeSession: (sessionId: string) => void;
  onPlaybackSession: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
}

export function AppSessionSection(props: AppSessionSectionProps) {
  return (
    <SessionScreen
      tracks={props.tracks}
      playlists={props.playlists}
      repositories={props.repositories}
      sessions={props.sessions}
      sessionBookmarksBySessionId={props.sessionBookmarksBySessionId}
      selectedSessionId={props.selectedSessionId}
      loading={props.sessionsLoading}
      mutating={props.sessionsMutating}
      error={props.sessionsError}
      activeSessionId={
        props.monitorSession?.persistedSessionId ?? props.monitorSession?.sessionId ?? null
      }
      activeSessionMode={
        props.monitorSession ? (props.monitorIsPlayback ? "playback" : "live") : null
      }
      activePlaybackProgress={props.monitorIsPlayback ? props.monitorPlaybackProgress : null}
      onStartSession={props.onStartSession}
      onStopSession={props.onStopSession}
      onResume={props.onResumeSession}
      onPlayback={props.onPlaybackSession}
      onReplayBookmark={props.onReplayBookmark}
      onDelete={props.onDeleteSession}
      onSelectSession={props.onSelectSession}
    />
  );
}
