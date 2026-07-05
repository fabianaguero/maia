import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  resolveSessionControllerDerivedDetails,
  type SessionControllerDerivedDetailsState,
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
import type {
  SessionControllerDerivedBookmarkState,
  SessionControllerDerivedSections,
  SessionControllerDerivedSelectionArgs,
  SessionControllerDerivedSelectionState,
  SessionControllerDerivedState,
} from "./sessionControllerDerivedContracts";

export {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
};
export type { SessionEntitySelection, SessionResolvedSelection };
export type { SessionDetailSummary, SessionSourceSummary };
export type {
  SessionControllerDerivedBookmarkState,
  SessionControllerDerivedSections,
  SessionControllerDerivedSelectionArgs,
  SessionControllerDerivedSelectionState,
  SessionControllerDerivedState,
};

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

export function buildSessionControllerDerivedSelectionState(
  input: SessionControllerDerivedSelectionArgs,
): SessionControllerDerivedSelectionState {
  return {
    sourceOptions: input.sourceOptions,
    selectedSource: input.entitySelection.selectedSource,
    selectedTrack: input.entitySelection.selectedTrack,
    selectedPlaylist: input.entitySelection.selectedPlaylist,
    sessionSelection: input.sessionSelection,
  };
}

export function buildSessionControllerDerivedBookmarkInput(input: {
  selectedSession: PersistedSession | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionEvents: SessionEvent[];
}) {
  return input;
}

export function buildSessionControllerDerivedBookmarkState(input: {
  selectedSession: PersistedSession | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionEvents: SessionEvent[];
}): SessionControllerDerivedBookmarkState {
  return resolveSessionBookmarkState(input);
}

export function buildSessionControllerDerivedDetailsInput(input: {
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
}) {
  return input;
}

export function buildSessionControllerDerivedDetailsState(input: {
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
}): SessionControllerDerivedDetailsState {
  return resolveSessionControllerDerivedDetails(input);
}

export function resolveSessionControllerDerivedSelectionState(
  input: SessionControllerDerivedInput,
): SessionControllerDerivedSelectionState {
  return buildSessionControllerDerivedSelectionState({
    sourceOptions: resolveSourceOptions(input.mode, input.repositories),
    entitySelection: resolveSelectedEntities({
      playlists: input.playlists,
      repositories: input.repositories,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
      tracks: input.tracks,
    }),
    sessionSelection: resolveSessionSelection({
      sessions: input.sessions,
      activeSessionId: input.activeSessionId,
      selectedSessionId: input.selectedSessionId,
      activeSessionMode: input.activeSessionMode,
      monitorHasSession: input.monitorHasSession,
      tracks: input.tracks,
      playlists: input.playlists,
    }),
  });
}

export function resolveSessionControllerDerivedSections(input: SessionControllerDerivedInput) {
  const selectionState = resolveSessionControllerDerivedSelectionState(input);

  return buildSessionControllerDerivedSections({
    input,
    selectionState,
  });
}

export function buildSessionControllerDerivedSections(input: {
  input: SessionControllerDerivedInput;
  selectionState: SessionControllerDerivedSelectionState;
}): SessionControllerDerivedSections {
  const bookmarkState = buildSessionControllerDerivedBookmarkState(
    buildSessionControllerDerivedBookmarkInput({
      selectedSession: input.selectionState.sessionSelection.selectedSession,
      sessionBookmarksBySessionId: input.input.sessionBookmarksBySessionId,
      selectedSessionEvents: input.input.selectedSessionEvents,
    }),
  );
  const detailsState = buildSessionControllerDerivedDetailsState(
    buildSessionControllerDerivedDetailsInput({
      baseMode: input.input.baseMode,
      selectedTrack: input.selectionState.selectedTrack,
      selectedPlaylist: input.selectionState.selectedPlaylist,
      tracks: input.input.tracks,
      selectedPlaylistId: input.input.selectedPlaylistId,
      selectedSourceId: input.input.selectedSourceId,
      selectedTrackId: input.input.selectedTrackId,
      selectedSource: input.selectionState.selectedSource,
      templateGenre: input.input.templateGenre,
      templateLabel: input.input.templateLabel,
      sessionPlaceholderFallback: input.input.sessionPlaceholderFallback,
      activePlaybackProgress: input.input.activePlaybackProgress,
      activeSession: input.selectionState.sessionSelection.activeSession,
      selectedSession: input.selectionState.sessionSelection.selectedSession,
      repositories: input.input.repositories,
      playlists: input.input.playlists,
    }),
  );

  return {
    selectionState: input.selectionState,
    bookmarkState,
    detailsState,
  };
}

export function buildSessionControllerDerivedState(
  input: SessionControllerDerivedSections,
): SessionControllerDerivedState {
  return {
    sourceOptions: input.selectionState.sourceOptions,
    selectedSource: input.selectionState.selectedSource,
    selectedTrack: input.selectionState.selectedTrack,
    selectedPlaylist: input.selectionState.selectedPlaylist,
    selectedBaseDetails: input.detailsState.selectedBaseDetails,
    activeSession: input.selectionState.sessionSelection.activeSession,
    selectedSession: input.selectionState.sessionSelection.selectedSession,
    selectedSessionIdForEvents: input.selectionState.sessionSelection.selectedSessionIdForEvents,
    playbackActive: input.selectionState.sessionSelection.playbackActive,
    liveMonitorActive: input.selectionState.sessionSelection.liveMonitorActive,
    activeBedUrl: input.selectionState.sessionSelection.activeBedUrl,
    selectedSessionBookmarks: input.bookmarkState.selectedSessionBookmarks,
    bookmarkContexts: input.bookmarkState.bookmarkContexts,
    sessionLabelPlaceholder: input.detailsState.sessionLabelPlaceholder,
    playbackPercent: input.detailsState.playbackPercent,
    readyToRun: input.detailsState.readyToRun,
    activeBaseDetails: input.detailsState.activeBaseDetails,
    selectedSessionBaseDetails: input.detailsState.selectedSessionBaseDetails,
    activeSourceDetails: input.detailsState.activeSourceDetails,
    selectedSessionSourceDetails: input.detailsState.selectedSessionSourceDetails,
  };
}

export function resolveSessionControllerDerivedState(
  input: SessionControllerDerivedInput,
): SessionControllerDerivedState {
  return buildSessionControllerDerivedState(resolveSessionControllerDerivedSections(input));
}
