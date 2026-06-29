import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../types/library";
import type { StartSessionInput } from "../types/monitor";

export interface UseAppMonitorActionsInput {
  t: {
    appShell: {
      replayUnavailableTitle: string;
      replayUnavailableBody: string;
    };
    session: {
      unnamedSession: string;
    };
  };
  library: {
    tracks: LibraryTrack[];
    playlists: BaseTrackPlaylist[];
    selectedTrack: LibraryTrack | null;
    selectedPlaylist: BaseTrackPlaylist | null;
    setSelectedTrackId: (trackId: string | null) => void;
    setSelectedPlaylistId: (playlistId: string | null) => void;
  };
  repositories: {
    repositories: RepositoryAnalysis[];
    setSelectedRepositoryId: (repositoryId: string | null) => void;
  };
  sessions: {
    sessions: PersistedSession[];
    setSelectedSessionId: (sessionId: string) => void;
    createSession: (input: CreateSessionInput) => Promise<PersistedSession | null>;
    clearError: () => void;
  };
  monitor: {
    session: {
      persistedSessionId: string | null;
      repoId: string;
    } | null;
    isPlayback: boolean;
    setGuideTrack: (path: string | null) => void;
    setGuideTrackPlaylist: (paths: string[]) => void;
    playbackSession: (input: {
      sessionId: string;
      label: string;
      sourcePath: string;
      repoId?: string | null;
    }) => Promise<boolean>;
    pausePlayback: () => void;
    seekPlaybackWindow: (replayWindowIndex: number) => void;
    startSession: (
      repo: RepositoryAnalysis,
      input: StartSessionInput,
      persistedSessionId?: string,
    ) => Promise<boolean>;
  };
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  setAnalysisMode: (mode: AnalyzerViewMode) => void;
  setScreen: (screen: AppScreen) => void;
  setPillar: (pillar: AppPillar) => void;
}
