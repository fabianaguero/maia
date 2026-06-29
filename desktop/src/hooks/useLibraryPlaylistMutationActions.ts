import { startTransition } from "react";

import { deleteBaseTrackPlaylist, saveBaseTrackPlaylist } from "../api/library";
import type { BaseTrackPlaylist, SaveBaseTrackPlaylistInput } from "../types/library";
import {
  appendSavedPlaylist,
  clearDeletedPlaylistSelection,
  removeDeletedPlaylist,
  toLibraryErrorMessage,
} from "./libraryRuntime";
import type { UseLibraryMutationActionsInput } from "./libraryMutationActionsTypes";

type PlaylistMutationActionsInput = Pick<
  UseLibraryMutationActionsInput,
  "setPlaylists" | "setSelectedPlaylistId" | "setMutating" | "setError"
>;

export function useLibraryPlaylistMutationActions({
  setPlaylists,
  setSelectedPlaylistId,
  setMutating,
  setError,
}: PlaylistMutationActionsInput) {
  async function savePlaylist(
    input: SaveBaseTrackPlaylistInput,
  ): Promise<BaseTrackPlaylist | null> {
    setMutating(true);

    try {
      const nextPlaylist = await saveBaseTrackPlaylist(input);

      startTransition(() => {
        setPlaylists((current) => appendSavedPlaylist(current, nextPlaylist));
        setSelectedPlaylistId(nextPlaylist.id);
        setError(null);
      });

      return nextPlaylist;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function deletePlaylist(playlistId: string): Promise<boolean> {
    setMutating(true);

    try {
      await deleteBaseTrackPlaylist(playlistId);

      startTransition(() => {
        setPlaylists((current) => removeDeletedPlaylist(current, playlistId));
        setSelectedPlaylistId((current) => clearDeletedPlaylistSelection(current, playlistId));
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return false;
    } finally {
      setMutating(false);
    }
  }

  return {
    savePlaylist,
    deletePlaylist,
  };
}
