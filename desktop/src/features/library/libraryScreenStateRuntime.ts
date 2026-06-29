import type { BaseTrackPlaylist, SaveBaseTrackPlaylistInput } from "../../types/library";

export interface LibraryPlaylistEditorState {
  playlistEditorOpen: boolean;
  playlistEditorId: string | null;
  playlistName: string;
  playlistTrackIds: string[];
}

export function buildLibraryPlaylistEditorOpenState(
  playlist?: BaseTrackPlaylist,
): LibraryPlaylistEditorState {
  return {
    playlistEditorOpen: true,
    playlistEditorId: playlist?.id ?? null,
    playlistName: playlist?.name ?? "",
    playlistTrackIds: playlist?.trackIds ?? [],
  };
}

export function buildLibraryPlaylistEditorResetState(): LibraryPlaylistEditorState {
  return {
    playlistEditorOpen: false,
    playlistEditorId: null,
    playlistName: "",
    playlistTrackIds: [],
  };
}

export function toggleLibraryPlaylistTrackId(current: string[], trackId: string): string[] {
  return current.includes(trackId)
    ? current.filter((id) => id !== trackId)
    : [...current, trackId];
}

export function buildLibraryPlaylistSaveInput(input: {
  playlistEditorId: string | null;
  playlistName: string;
  playlistTrackIds: string[];
}): SaveBaseTrackPlaylistInput {
  return {
    id: input.playlistEditorId ?? undefined,
    name: input.playlistName,
    trackIds: input.playlistTrackIds,
  };
}

export function resolveSelectedLibraryPlaylist(
  playlists: BaseTrackPlaylist[],
  selectedPlaylistId: string | null,
): BaseTrackPlaylist | null {
  return playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
}

export function buildLibraryPlaylistEditorSyncState(input: {
  playlistEditorOpen: boolean;
  playlistEditorId: string | null;
  selectedPlaylist: BaseTrackPlaylist | null;
}): LibraryPlaylistEditorState | null {
  if (!input.selectedPlaylist) {
    return input.playlistEditorOpen ? null : buildLibraryPlaylistEditorResetState();
  }

  if (input.playlistEditorOpen && input.playlistEditorId === input.selectedPlaylist.id) {
    return {
      playlistEditorOpen: true,
      playlistEditorId: input.selectedPlaylist.id,
      playlistName: input.selectedPlaylist.name,
      playlistTrackIds: input.selectedPlaylist.trackIds,
    };
  }

  return null;
}

export function resolveLibraryLogConnectionError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
