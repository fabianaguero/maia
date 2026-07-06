import type { Dispatch, SetStateAction } from "react";

import type {
  BaseTrackPlaylist,
  LogSourceConnection,
  SaveBaseTrackPlaylistInput,
} from "../../types/library";
import type { LibraryTab } from "./libraryScreenTypes";

export function buildLibraryScreenTabChangeHookState(input: {
  nextTab: LibraryTab;
  setTab: Dispatch<SetStateAction<LibraryTab>>;
  onTabChange?: (tab: LibraryTab) => void;
  setShowForm: Dispatch<SetStateAction<boolean>>;
}) {
  return input;
}

export function buildLibraryScreenRefreshConnectionsInput(input: {
  setLogConnectionError: Dispatch<SetStateAction<string | null>>;
  setLogConnections: Dispatch<SetStateAction<LogSourceConnection[]>>;
  listLogSourceConnections: () => Promise<LogSourceConnection[]>;
}) {
  return input;
}

export function buildLibraryScreenPlaylistSyncInput(input: {
  playlistEditorOpen: boolean;
  playlistEditorId: string | null;
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
}) {
  return input;
}

export function buildLibraryScreenPlaylistSaveHookInput(input: {
  onSavePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<boolean>;
  playlistEditorId: string | null;
  playlistName: string;
  playlistTrackIds: string[];
}) {
  return {
    onSavePlaylist: input.onSavePlaylist,
    playlistSaveInput: {
      playlistEditorId: input.playlistEditorId,
      playlistName: input.playlistName,
      playlistTrackIds: input.playlistTrackIds,
    },
  };
}

export function buildLibraryScreenStateHookResult<TState>(state: TState): TState {
  return state;
}
