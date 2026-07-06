import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionBookmarkRuntime";
import type {
  SessionControllerDerivedDetailsState,
  SessionDetailSummary,
  SessionSourceSummary,
} from "./sessionControllerDerivedDetailsRuntime";
import type {
  SessionEntitySelection,
  SessionResolvedSelection,
} from "./sessionControllerDerivedSelectionRuntime";

export interface SessionControllerDerivedSelectionArgs {
  sourceOptions: RepositoryAnalysis[];
  entitySelection: SessionEntitySelection;
  sessionSelection: SessionResolvedSelection;
}

export interface SessionControllerDerivedSelectionInput {
  mode: QuickSessionMode;
  repositories: RepositoryAnalysis[];
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  tracks: LibraryTrack[];
  sessions: PersistedSession[];
  activeSessionId: string | null;
  selectedSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  monitorHasSession: boolean;
}

export interface SessionControllerDerivedInput {
  activePlaybackProgress: number | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  monitorHasSession: boolean;
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  selectedPlaylistId: string | null;
  selectedSessionEvents: SessionEvent[];
  selectedSessionId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  sessionPlaceholderFallback: string;
  sessions: PersistedSession[];
  templateGenre: string | null;
  templateLabel: string | null;
  tracks: LibraryTrack[];
}

export interface SessionControllerDerivedSelectionState {
  sourceOptions: RepositoryAnalysis[];
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  sessionSelection: SessionResolvedSelection;
}

export interface SessionControllerDerivedBookmarkState {
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkContexts: Record<number, SessionBookmarkContext>;
}

export interface SessionControllerDerivedBookmarkInput {
  selectedSession: PersistedSession | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionEvents: SessionEvent[];
}

export interface SessionControllerDerivedDetailsInput {
  baseMode: SessionBaseMode;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  tracks: LibraryTrack[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedSource: RepositoryAnalysis | null;
  templateGenre: string | null;
  templateLabel: string | null;
  sessionPlaceholderFallback: string;
  activePlaybackProgress: number | null;
  activeSession: PersistedSession | null;
  selectedSession: PersistedSession | null;
  repositories: RepositoryAnalysis[];
  playlists: BaseTrackPlaylist[];
}

export interface SessionControllerDerivedSections {
  selectionState: SessionControllerDerivedSelectionState;
  bookmarkState: SessionControllerDerivedBookmarkState;
  detailsState: SessionControllerDerivedDetailsState;
}

export interface SessionControllerDerivedSectionsInput {
  input: SessionControllerDerivedInput;
  selectionState: SessionControllerDerivedSelectionState;
}

export interface SessionControllerDerivedSectionInputs {
  bookmarkInput: SessionControllerDerivedBookmarkInput;
  detailsInput: SessionControllerDerivedDetailsInput;
}

export type SessionControllerDerivedSelectionBindings = Pick<
  SessionControllerDerivedState,
  "sourceOptions" | "selectedSource" | "selectedTrack" | "selectedPlaylist"
>;

export type SessionControllerDerivedSessionBindings = Pick<
  SessionControllerDerivedState,
  | "activeSession"
  | "selectedSession"
  | "selectedSessionIdForEvents"
  | "playbackActive"
  | "liveMonitorActive"
  | "activeBedUrl"
>;

export type SessionControllerDerivedBookmarkBindings = Pick<
  SessionControllerDerivedState,
  "selectedSessionBookmarks" | "bookmarkContexts"
>;

export type SessionControllerDerivedDetailsBindings = Pick<
  SessionControllerDerivedState,
  | "selectedBaseDetails"
  | "sessionLabelPlaceholder"
  | "playbackPercent"
  | "readyToRun"
  | "activeBaseDetails"
  | "selectedSessionBaseDetails"
  | "activeSourceDetails"
  | "selectedSessionSourceDetails"
>;

export interface SessionControllerDerivedState {
  sourceOptions: RepositoryAnalysis[];
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseDetails: SessionDetailSummary;
  activeSession: PersistedSession | null;
  selectedSession: PersistedSession | null;
  selectedSessionIdForEvents: string | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  activeBedUrl: string | null;
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  sessionLabelPlaceholder: string;
  playbackPercent: number | null;
  readyToRun: boolean;
  activeBaseDetails: SessionDetailSummary;
  selectedSessionBaseDetails: SessionDetailSummary;
  activeSourceDetails: SessionSourceSummary;
  selectedSessionSourceDetails: SessionSourceSummary;
}
