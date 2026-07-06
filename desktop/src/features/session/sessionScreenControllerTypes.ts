import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/types";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { StartSessionInput } from "../../types/monitor";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { MonitorContextValue } from "../monitor/monitorContextTypes";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type {
  SessionBookmarkContext,
  SessionDetailSummary,
  SessionStartDraft,
} from "./sessionScreenRuntime";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

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
  t: AppTranslations;
  monitor: MonitorContextValue;
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
  latestUpdate: LiveLogStreamUpdate | null;
  directPath: string;
  setDirectPath: (path: string) => void;
  isDirectLoading: boolean;
  selectedTemplateId: string;
  setSelectedTemplateId: (templateId: string) => void;
  sourceOptions: RepositoryAnalysis[];
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseDetails: SessionDetailSummary;
  handleCreateSession: () => Promise<void>;
  handleDirectLaunch: () => Promise<void>;
  handleResumeSession: (sessionId: string) => void;
  handlePlaybackSession: (session: PersistedSession) => Promise<void>;
  handleReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<void>;
  activeSession: PersistedSession | null;
  selectedSession: PersistedSession | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  sessionLabelPlaceholder: string;
  readyToRun: boolean;
  booth: SessionBoothViewModel;
}
