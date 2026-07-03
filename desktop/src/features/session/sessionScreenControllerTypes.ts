import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionStartDraft } from "./sessionScreenRuntime";

export interface SessionScreenControllerInput {
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

export interface SessionScreenControllerState {
  t: unknown;
  monitor: unknown;
  mode: QuickSessionMode;
  setMode: (mode: QuickSessionMode) => void;
  baseMode: SessionBaseMode;
  setBaseMode: (mode: SessionBaseMode) => void;
  selectedSourceId: string | null;
  setSelectedSourceId: (sourceId: string | null) => void;
  selectedTrackId: string | null;
  setSelectedTrackId: (trackId: string | null) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (playlistId: string | null) => void;
  sessionLabel: string;
  setSessionLabel: (label: string) => void;
  creating: boolean;
  createError: string | null;
  latestUpdate: unknown;
  directPath: string;
  setDirectPath: (path: string) => void;
  isDirectLoading: boolean;
  selectedTemplateId: string;
  setSelectedTemplateId: (templateId: string) => void;
  sourceOptions: unknown;
  selectedSource: unknown;
  selectedTrack: unknown;
  selectedPlaylist: unknown;
  selectedBaseDetails: unknown;
  handleCreateSession: () => Promise<void>;
  handleDirectLaunch: () => Promise<void>;
  handleResumeSession: (sessionId: string) => void;
  handlePlaybackSession: (session: PersistedSession) => Promise<void>;
  handleReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<void>;
  activeSession: unknown;
  selectedSession: unknown;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkContexts: unknown;
  selectedSessionReplayFeedbackRecommendation: unknown;
  sessionLabelPlaceholder: string;
  readyToRun: boolean;
  booth: unknown;
}
