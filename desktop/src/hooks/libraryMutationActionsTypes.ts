import type { Dispatch, SetStateAction } from "react";

import type {
  BaseTrackPlaylist,
  LibraryTrack,
} from "../types/library";

export interface UseLibraryMutationActionsInput {
  tracks: LibraryTrack[];
  setTracks: Dispatch<SetStateAction<LibraryTrack[]>>;
  setPlaylists: Dispatch<SetStateAction<BaseTrackPlaylist[]>>;
  setSelectedTrackId: Dispatch<SetStateAction<string | null>>;
  setSelectedPlaylistId: Dispatch<SetStateAction<string | null>>;
  setMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}
