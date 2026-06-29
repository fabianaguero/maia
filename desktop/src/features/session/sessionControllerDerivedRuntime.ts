import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  resolveBaseDetails,
  resolveSelectedBaseDetails,
  resolveSessionBedPath,
  resolveSessionBedUrl,
  resolveSourceDetails,
} from "./sessionDisplay";
import { resolveBookmarkContext, type SessionBookmarkContext } from "./sessionBookmarkRuntime";
import {
  buildSessionLabelPlaceholder,
  resolvePlaybackPercent,
  resolveReadyToRun,
} from "./sessionStartPlanRuntime";

export interface SessionEntitySelection {
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
}

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

export function resolveSourceOptions(
  mode: QuickSessionMode,
  repositories: RepositoryAnalysis[],
): RepositoryAnalysis[] {
  return repositories.filter((entry) =>
    mode === "log" ? entry.sourceKind === "file" : entry.sourceKind !== "file",
  );
}

export function resolveSelectedEntities(input: {
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  tracks: LibraryTrack[];
}): SessionEntitySelection {
  return {
    selectedSource:
      input.repositories.find((repository) => repository.id === input.selectedSourceId) ?? null,
    selectedTrack: input.tracks.find((track) => track.id === input.selectedTrackId) ?? null,
    selectedPlaylist:
      input.playlists.find((playlist) => playlist.id === input.selectedPlaylistId) ?? null,
  };
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

  const activeSession =
    input.sessions.find((session) => session.id === input.activeSessionId) ?? null;
  const selectedSession =
    input.sessions.find((session) => session.id === input.selectedSessionId) ??
    activeSession ??
    input.sessions[0] ??
    null;
  const selectedSessionIdForEvents = selectedSession?.id ?? null;
  const playbackActive = input.activeSessionMode === "playback" && Boolean(activeSession);
  const liveMonitorActive = input.monitorHasSession && !playbackActive;
  const activeBedUrl = resolveSessionBedUrl(
    liveMonitorActive && !playbackActive
      ? resolveSessionBedPath(activeSession, input.tracks, input.playlists)
      : null,
  );

  const selectedSessionBookmarks = selectedSession
    ? (input.sessionBookmarksBySessionId[selectedSession.id] ?? [])
    : [];
  const bookmarkContexts: Record<number, SessionBookmarkContext> = {};
  for (const bookmark of selectedSessionBookmarks) {
    bookmarkContexts[bookmark.id] = resolveBookmarkContext(bookmark, input.selectedSessionEvents);
  }

  return {
    sourceOptions,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseDetails,
    activeSession,
    selectedSession,
    selectedSessionIdForEvents,
    playbackActive,
    liveMonitorActive,
    activeBedUrl,
    selectedSessionBookmarks,
    bookmarkContexts,
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
    activeBaseDetails: resolveBaseDetails(activeSession, input.tracks, input.playlists),
    selectedSessionBaseDetails: resolveBaseDetails(selectedSession, input.tracks, input.playlists),
    activeSourceDetails: resolveSourceDetails(activeSession, input.repositories),
    selectedSessionSourceDetails: resolveSourceDetails(selectedSession, input.repositories),
  };
}
