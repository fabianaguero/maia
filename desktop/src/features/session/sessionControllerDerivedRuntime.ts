import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionBookmarkRuntime";
import {
  resolveSessionControllerDerivedDetails,
  type SessionDetailSummary,
  type SessionSourceSummary,
} from "./sessionControllerDerivedDetailsRuntime";
import {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
  type SessionEntitySelection,
  type SessionResolvedSelection,
} from "./sessionControllerDerivedSelectionRuntime";
export {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
};
export type { SessionEntitySelection, SessionResolvedSelection };
export type { SessionDetailSummary, SessionSourceSummary };

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

export function resolveSessionControllerDerivedState(input: {
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
}): SessionControllerDerivedState {
  const sourceOptions = resolveSourceOptions(input.mode, input.repositories);
  const { selectedSource, selectedTrack, selectedPlaylist } = resolveSelectedEntities({
    playlists: input.playlists,
    repositories: input.repositories,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    tracks: input.tracks,
  });
  const sessionSelection = resolveSessionSelection({
    sessions: input.sessions,
    activeSessionId: input.activeSessionId,
    selectedSessionId: input.selectedSessionId,
    activeSessionMode: input.activeSessionMode,
    monitorHasSession: input.monitorHasSession,
    tracks: input.tracks,
    playlists: input.playlists,
  });
  const bookmarkState = resolveSessionBookmarkState({
    selectedSession: sessionSelection.selectedSession,
    sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
    selectedSessionEvents: input.selectedSessionEvents,
  });
  const detailsState = resolveSessionControllerDerivedDetails({
    baseMode: input.baseMode,
    selectedTrack,
    selectedPlaylist,
    tracks: input.tracks,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    selectedSource,
    templateGenre: input.templateGenre,
    templateLabel: input.templateLabel,
    sessionPlaceholderFallback: input.sessionPlaceholderFallback,
    activePlaybackProgress: input.activePlaybackProgress,
    activeSession: sessionSelection.activeSession,
    selectedSession: sessionSelection.selectedSession,
    repositories: input.repositories,
    playlists: input.playlists,
  });

  return {
    sourceOptions,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseDetails: detailsState.selectedBaseDetails,
    activeSession: sessionSelection.activeSession,
    selectedSession: sessionSelection.selectedSession,
    selectedSessionIdForEvents: sessionSelection.selectedSessionIdForEvents,
    playbackActive: sessionSelection.playbackActive,
    liveMonitorActive: sessionSelection.liveMonitorActive,
    activeBedUrl: sessionSelection.activeBedUrl,
    selectedSessionBookmarks: bookmarkState.selectedSessionBookmarks,
    bookmarkContexts: bookmarkState.bookmarkContexts,
    sessionLabelPlaceholder: detailsState.sessionLabelPlaceholder,
    playbackPercent: detailsState.playbackPercent,
    readyToRun: detailsState.readyToRun,
    activeBaseDetails: detailsState.activeBaseDetails,
    selectedSessionBaseDetails: detailsState.selectedSessionBaseDetails,
    activeSourceDetails: detailsState.activeSourceDetails,
    selectedSessionSourceDetails: detailsState.selectedSessionSourceDetails,
  };
}
