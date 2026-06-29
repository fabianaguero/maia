import { startTransition, useEffect, type Dispatch, type SetStateAction } from "react";

import { listPlaylists, listTracks } from "../api/library";
import type { BaseTrackPlaylist, LibraryTrack } from "../types/library";
import {
  resolveSelectedPlaylistId,
  resolveSelectedTrackId,
  sortPlaylistsByUpdatedAt,
  sortTracksByImportedAt,
  toLibraryErrorMessage,
} from "./libraryRuntime";

interface UseLibraryBootstrapInput {
  setTracks: Dispatch<SetStateAction<LibraryTrack[]>>;
  setPlaylists: Dispatch<SetStateAction<BaseTrackPlaylist[]>>;
  setSelectedTrackId: Dispatch<SetStateAction<string | null>>;
  setSelectedPlaylistId: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function useLibraryBootstrap({
  setTracks,
  setPlaylists,
  setSelectedTrackId,
  setSelectedPlaylistId,
  setLoading,
  setError,
}: UseLibraryBootstrapInput) {
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [nextTracks, nextPlaylists] = await Promise.all([listTracks(), listPlaylists()]);

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortTracksByImportedAt(nextTracks);
          const sortedPlaylists = sortPlaylistsByUpdatedAt(nextPlaylists);
          setTracks(sorted);
          setPlaylists(sortedPlaylists);
          setSelectedTrackId((current) => resolveSelectedTrackId(current, sorted));
          setSelectedPlaylistId((current) => resolveSelectedPlaylistId(current, sortedPlaylists));
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(toLibraryErrorMessage(nextError));
          setLoading(false);
        });
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [setError, setLoading, setPlaylists, setSelectedPlaylistId, setSelectedTrackId, setTracks]);
}
