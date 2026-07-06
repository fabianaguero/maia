import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/types";
import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionStartDraft } from "./sessionScreenRuntime";

export interface UseSessionScreenActionsInput {
  t: AppTranslations;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionLabel: string;
  directPath: string;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onResume: (sessionId: string) => void;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
  setCreating: (value: boolean) => void;
  setIsDirectLoading: (value: boolean) => void;
  setSessionLabel: (value: string) => void;
  setSelectedSourceId: (value: string | null) => void;
  setSelectedTrackId: (value: string | null) => void;
  setSelectedPlaylistId: (value: string | null) => void;
  setDirectPath: (value: string) => void;
}

export interface SessionScreenActionsState {
  handleCreateSession: () => Promise<void>;
  handleDirectLaunch: () => Promise<void>;
  handleResumeSession: (sessionId: string) => Promise<void>;
  handlePlaybackSession: (session: PersistedSession) => Promise<void>;
  handleReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<void>;
}
