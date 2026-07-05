import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
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

export interface SessionControllerDerivedSections {
  selectionState: SessionControllerDerivedSelectionState;
  bookmarkState: SessionControllerDerivedBookmarkState;
  detailsState: SessionControllerDerivedDetailsState;
}

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
