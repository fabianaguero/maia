import { startTransition } from "react";

import type { MusicalAsset } from "../contracts";
import type { BaseTrackPlaylist, LibraryTrack, RelinkMissingTracksResult } from "../types/library";
import {
  appendImportedTrack,
  applyAnalyzedTrackMetadata,
  clearDeletedTrackSelection,
  removeDeletedTrack,
  removeTrackFromPlaylists,
  replaceRelinkedTracks,
  replaceTrack,
  resolvePreferredRelinkSelection,
  sortTracksByImportedAt,
  toLibraryErrorMessage,
} from "./libraryRuntime";

interface LibraryTrackMutationState {
  setTracks: React.Dispatch<React.SetStateAction<LibraryTrack[]>>;
  setPlaylists: React.Dispatch<React.SetStateAction<BaseTrackPlaylist[]>>;
  setSelectedTrackId: React.Dispatch<React.SetStateAction<string | null>>;
  setMutating: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export async function runLibraryTrackMutation<T, F>(input: {
  state: Pick<LibraryTrackMutationState, "setMutating" | "setError">;
  task: () => Promise<T>;
  onSuccess?: (value: T) => void;
  onErrorValue: F;
  trackMutating?: boolean;
}): Promise<T | F> {
  const { state, task, onSuccess, onErrorValue, trackMutating = true } = input;

  if (trackMutating) {
    state.setMutating(true);
  }

  try {
    const result = await task();
    startTransition(() => {
      onSuccess?.(result);
      state.setError(null);
    });
    return result;
  } catch (error) {
    startTransition(() => {
      state.setError(toLibraryErrorMessage(error));
    });
    return onErrorValue;
  } finally {
    if (trackMutating) {
      state.setMutating(false);
    }
  }
}

export function commitImportedTrack(
  state: Pick<LibraryTrackMutationState, "setTracks" | "setSelectedTrackId">,
  nextTrack: LibraryTrack,
) {
  state.setTracks((current) => appendImportedTrack(current, nextTrack));
  state.setSelectedTrackId(nextTrack.id);
}

export function commitAnalyzedTrackMetadata(
  state: Pick<LibraryTrackMutationState, "setTracks">,
  trackId: string,
  analyzed: MusicalAsset,
) {
  state.setTracks((current) => applyAnalyzedTrackMetadata(current, trackId, analyzed));
}

export function commitReplacedTrack(
  state: Pick<LibraryTrackMutationState, "setTracks">,
  trackId: string,
  nextTrack: LibraryTrack,
) {
  state.setTracks((current) => replaceTrack(current, trackId, nextTrack));
}

export function commitSeededTracks(
  state: Pick<LibraryTrackMutationState, "setTracks" | "setSelectedTrackId">,
  tracks: LibraryTrack[],
) {
  const sorted = sortTracksByImportedAt(tracks);
  state.setTracks(sorted);
  state.setSelectedTrackId(sorted[0]?.id ?? null);
}

export function commitDeletedTrack(
  state: Pick<LibraryTrackMutationState, "setTracks" | "setPlaylists" | "setSelectedTrackId">,
  trackId: string,
) {
  state.setTracks((current) => removeDeletedTrack(current, trackId));
  state.setPlaylists((current) => removeTrackFromPlaylists(current, trackId));
  state.setSelectedTrackId((current) => clearDeletedTrackSelection(current, trackId));
}

export function commitRelinkedTracks(
  state: Pick<LibraryTrackMutationState, "setTracks" | "setSelectedTrackId">,
  result: RelinkMissingTracksResult,
) {
  state.setTracks((current) => replaceRelinkedTracks(current, result));
  const preferredSelection = resolvePreferredRelinkSelection(result);
  if (preferredSelection) {
    state.setSelectedTrackId(preferredSelection);
  }
}
