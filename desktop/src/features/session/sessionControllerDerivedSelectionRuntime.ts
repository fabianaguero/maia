import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode } from "./sessionDisplay";
import { resolveSessionBedPath, resolveSessionBedUrl } from "./sessionDisplay";
import { resolveBookmarkContext, type SessionBookmarkContext } from "./sessionBookmarkRuntime";

export interface SessionEntitySelection {
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
}

export interface SessionResolvedSelection {
  activeSession: PersistedSession | null;
  selectedSession: PersistedSession | null;
  selectedSessionIdForEvents: string | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  activeBedUrl: string | null;
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

export function resolveSessionSelection(input: {
  sessions: PersistedSession[];
  activeSessionId: string | null;
  selectedSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  monitorHasSession: boolean;
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}): SessionResolvedSelection {
  const activeSession =
    input.sessions.find((session) => session.id === input.activeSessionId) ?? null;
  const selectedSession =
    input.sessions.find((session) => session.id === input.selectedSessionId) ??
    activeSession ??
    input.sessions[0] ??
    null;
  const playbackActive = input.activeSessionMode === "playback" && Boolean(activeSession);
  const liveMonitorActive = input.monitorHasSession && !playbackActive;

  return {
    activeSession,
    selectedSession,
    selectedSessionIdForEvents: selectedSession?.id ?? null,
    playbackActive,
    liveMonitorActive,
    activeBedUrl: resolveSessionBedUrl(
      liveMonitorActive && !playbackActive
        ? resolveSessionBedPath(activeSession, input.tracks, input.playlists)
        : null,
    ),
  };
}

export function resolveSessionBookmarkState(input: {
  selectedSession: PersistedSession | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionEvents: SessionEvent[];
}) {
  const selectedSessionBookmarks = input.selectedSession
    ? (input.sessionBookmarksBySessionId[input.selectedSession.id] ?? [])
    : [];
  const bookmarkContexts: Record<number, SessionBookmarkContext> = {};

  for (const bookmark of selectedSessionBookmarks) {
    bookmarkContexts[bookmark.id] = resolveBookmarkContext(bookmark, input.selectedSessionEvents);
  }

  return {
    selectedSessionBookmarks,
    bookmarkContexts,
  };
}
