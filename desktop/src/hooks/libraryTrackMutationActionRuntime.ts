import { startTransition } from "react";

import { runAnalyzerRequest } from "../api/analyzer";
import {
  checkTrackExists,
  pickTrackSourceDirectory,
  pickTrackSourcePath,
  resolveMissingTracksFromDirectory as persistMissingTrackRelink,
  updateTrackSource as persistTrackSource,
  importTrack,
} from "../api/library";
import { createAnalyzeTrackRequest } from "../contracts";
import type { MusicalAsset } from "../contracts";
import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  UpdateTrackSourceInput,
} from "../types/library";
import {
  appendImportedTrack,
  applyAnalyzedTrackMetadata,
  clearDeletedTrackSelection,
  removeDeletedTrack,
  removeTrackFromPlaylists,
  replaceRelinkedTracks,
  replaceTrack,
  resolvePreferredRelinkSelection,
  resolveReanalyzeTrackInput,
  shouldAnalyzeImportedTrack,
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

export async function analyzeTrackInBackground(
  state: Pick<LibraryTrackMutationState, "setTracks">,
  track: LibraryTrack,
): Promise<void> {
  try {
    const request = createAnalyzeTrackRequest(track.file.sourcePath);
    const response = await runAnalyzerRequest(request);

    if (response.status === "ok" && "musicalAsset" in response.payload) {
      const analyzed = response.payload.musicalAsset;
      commitAnalyzedTrackMetadata(state, track.id, analyzed);
    }
  } catch (error) {
    console.debug("Background analysis failed:", error);
  }
}

export async function importLibraryTrackWithBackgroundAnalysis(input: {
  state: Pick<LibraryTrackMutationState, "setTracks">;
  importInput: ImportTrackInput;
}): Promise<LibraryTrack | null> {
  const nextTrack = await importTrack(input.importInput);
  if (nextTrack && shouldAnalyzeImportedTrack(nextTrack)) {
    void analyzeTrackInBackground(input.state, nextTrack);
  }
  return nextTrack;
}

export async function reanalyzeLibraryTrack(input: {
  tracks: LibraryTrack[];
  trackId: string;
}): Promise<LibraryTrack> {
  const track = input.tracks.find((entry) => entry.id === input.trackId);
  if (!track) {
    throw new Error("Track not found");
  }

  const fileExists = await checkTrackExists(track.file.sourcePath);
  if (!fileExists) {
    throw new Error(`Track file not found: ${track.file.sourcePath}`);
  }

  return importTrack(resolveReanalyzeTrackInput(track));
}

export async function relinkLibraryTrack(input: {
  tracks: LibraryTrack[];
  trackId: string;
}): Promise<LibraryTrack | null> {
  const track = input.tracks.find((entry) => entry.id === input.trackId) ?? null;
  if (!track) {
    throw new Error("Track not found");
  }

  const pickedPath = await pickTrackSourcePath(track.file.sourcePath);
  if (!pickedPath) {
    return null;
  }

  const updateInput: UpdateTrackSourceInput = { sourcePath: pickedPath };
  return persistTrackSource(input.trackId, updateInput);
}

export async function relinkMissingLibraryTracksFromDirectory(input: {
  tracks: LibraryTrack[];
}): Promise<RelinkMissingTracksResult | null> {
  const firstMissingTrack = input.tracks.find((track) => track.file.availabilityState === "missing") ?? null;
  const pickedDirectory = await pickTrackSourceDirectory(firstMissingTrack?.file.sourcePath ?? undefined);
  if (!pickedDirectory) {
    return null;
  }

  return persistMissingTrackRelink(pickedDirectory);
}
