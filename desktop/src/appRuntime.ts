import type { PersistedSession } from "./api/sessions";
import { findPlaylistLeadTrack, resolvePlaylistTracks } from "./utils/playlist";
import { resolvePlayableTrackPath } from "./utils/track";
import type {
  BaseTrackPlaylist,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";

export interface AppArmState {
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
}

export interface AppMonitorGuideState {
  trackPath: string | null;
  playlistPaths: string[] | null;
}

export function resolveTrackArmState(
  trackId: string | null | undefined,
  tracks: readonly LibraryTrack[],
): AppArmState {
  const track =
    typeof trackId === "string" ? (tracks.find((entry) => entry.id === trackId) ?? null) : null;

  return {
    selectedPlaylistId: null,
    selectedTrackId: track?.id ?? null,
  };
}

export function resolvePlaylistArmState(
  playlistId: string | null | undefined,
  playlists: readonly BaseTrackPlaylist[],
  tracks: readonly LibraryTrack[],
): AppArmState {
  const playlist =
    typeof playlistId === "string"
      ? (playlists.find((entry) => entry.id === playlistId) ?? null)
      : null;
  const leadTrack = findPlaylistLeadTrack(playlist, tracks);

  return {
    selectedPlaylistId: playlist?.id ?? null,
    selectedTrackId: leadTrack?.id ?? null,
  };
}

export function resolveLibraryMonitorGuideState(options: {
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedTrack: LibraryTrack | null;
  tracks: readonly LibraryTrack[];
}): AppMonitorGuideState {
  const { selectedPlaylist, selectedTrack, tracks } = options;

  if (selectedPlaylist) {
    const playlistPaths = resolvePlaylistTracks(selectedPlaylist, tracks)
      .map((track) => resolvePlayableTrackPath(track))
      .filter((path): path is string => Boolean(path));

    return {
      trackPath: null,
      playlistPaths,
    };
  }

  return {
    trackPath: selectedTrack ? resolvePlayableTrackPath(selectedTrack) : null,
    playlistPaths: null,
  };
}

export function resolveSessionMonitorGuideState(
  draft:
    | {
        trackId?: string;
        playlistId?: string;
      }
    | undefined,
  playlists: readonly BaseTrackPlaylist[],
  tracks: readonly LibraryTrack[],
): AppMonitorGuideState {
  if (draft?.playlistId) {
    const playlist = playlists.find((entry) => entry.id === draft.playlistId) ?? null;
    const playlistPaths = resolvePlaylistTracks(playlist, tracks)
      .map((track) => resolvePlayableTrackPath(track))
      .filter((path): path is string => Boolean(path));

    return {
      trackPath: null,
      playlistPaths,
    };
  }

  if (draft?.trackId) {
    const track = tracks.find((entry) => entry.id === draft.trackId) ?? null;

    return {
      trackPath: track ? resolvePlayableTrackPath(track) : null,
      playlistPaths: null,
    };
  }

  return {
    trackPath: null,
    playlistPaths: null,
  };
}

export function resolveReplaySourceRepository(
  session: PersistedSession,
  repositories: readonly RepositoryAnalysis[],
): RepositoryAnalysis | null {
  return (
    (session.sourceId ? repositories.find((entry) => entry.id === session.sourceId) : null) ??
    repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null
  );
}

export function shouldReuseActiveReplaySession(options: {
  currentPersistedSessionId: string | null | undefined;
  isPlayback: boolean;
  replaySessionId: string;
}): boolean {
  return options.isPlayback && options.currentPersistedSessionId === options.replaySessionId;
}

export function buildDiscoveredLogImportInputs(
  logPaths: readonly string[],
): ImportRepositoryInput[] {
  return logPaths.map((logPath) => ({
    sourceKind: "file",
    sourcePath: logPath,
    label: logPath.split("/").pop() || logPath,
  }));
}
