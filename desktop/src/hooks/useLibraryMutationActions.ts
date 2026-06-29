import { useLibraryPlaylistMutationActions } from "./useLibraryPlaylistMutationActions";
import { useLibraryTrackMutationActions } from "./useLibraryTrackMutationActions";
import type { UseLibraryMutationActionsInput } from "./libraryMutationActionsTypes";

export type { UseLibraryMutationActionsInput } from "./libraryMutationActionsTypes";

export function useLibraryMutationActions(input: UseLibraryMutationActionsInput) {
  const trackActions = useLibraryTrackMutationActions(input);
  const playlistActions = useLibraryPlaylistMutationActions(input);

  return {
    ...trackActions,
    ...playlistActions,
  };
}
