import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  resolveBaseDetails,
  resolveSelectedBaseDetails,
  resolveSourceDetails,
} from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionBookmarkRuntime";
import {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
  type SessionEntitySelection,
  type SessionResolvedSelection,
} from "./sessionControllerDerivedSelectionRuntime";
import {
  buildSessionLabelPlaceholder,
  resolvePlaybackPercent,
  resolveReadyToRun,
} from "./sessionStartPlanRuntime";
export {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
};
export type { SessionEntitySelection, SessionResolvedSelection };

export interface SessionDetailSummary {
  label: string | null;
  detail: string | null;
}

export interface SessionSourceSummary {
  label: string | null;
  path: string | null;
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
  const selectedBaseDetails = resolveSelectedBaseDetails(
    input.baseMode,
    selectedTrack,
    selectedPlaylist,
    input.tracks,
  );
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

  return {
    sourceOptions,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseDetails,
    activeSession: sessionSelection.activeSession,
    selectedSession: sessionSelection.selectedSession,
    selectedSessionIdForEvents: sessionSelection.selectedSessionIdForEvents,
    playbackActive: sessionSelection.playbackActive,
    liveMonitorActive: sessionSelection.liveMonitorActive,
    activeBedUrl: sessionSelection.activeBedUrl,
    selectedSessionBookmarks: bookmarkState.selectedSessionBookmarks,
    bookmarkContexts: bookmarkState.bookmarkContexts,
    sessionLabelPlaceholder: buildSessionLabelPlaceholder({
      selectedBaseLabel: selectedBaseDetails.label,
      selectedSourceTitle: selectedSource?.title ?? null,
      templateGenre: input.templateGenre,
      templateLabel: input.templateLabel,
      fallbackLabel: input.sessionPlaceholderFallback,
    }),
    playbackPercent: resolvePlaybackPercent(input.activePlaybackProgress),
    readyToRun: resolveReadyToRun({
      baseMode: input.baseMode,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
    }),
    activeBaseDetails: resolveBaseDetails(
      sessionSelection.activeSession,
      input.tracks,
      input.playlists,
    ),
    selectedSessionBaseDetails: resolveBaseDetails(
      sessionSelection.selectedSession,
      input.tracks,
      input.playlists,
    ),
    activeSourceDetails: resolveSourceDetails(sessionSelection.activeSession, input.repositories),
    selectedSessionSourceDetails: resolveSourceDetails(
      sessionSelection.selectedSession,
      input.repositories,
    ),
  };
}
