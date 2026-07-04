import {
  deleteTrack,
  seedDemoTracks,
  updateTrackAnalysis as persistTrackAnalysis,
  updateTrackPerformance as persistTrackPerformance,
} from "../api/library";
import type {
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import {
  commitDeletedTrack,
  commitImportedTrack,
  commitRelinkedTracks,
  commitReplacedTrack,
  commitSeededTracks,
  importLibraryTrackWithBackgroundAnalysis,
  relinkLibraryTrack,
  relinkMissingLibraryTracksFromDirectory,
  reanalyzeLibraryTrack,
  runLibraryTrackMutation,
} from "./libraryTrackMutationActionRuntime";
import type { UseLibraryMutationActionsInput } from "./libraryMutationActionsTypes";

type TrackMutationActionsInput = Pick<
  UseLibraryMutationActionsInput,
  "tracks" | "setTracks" | "setPlaylists" | "setSelectedTrackId" | "setMutating" | "setError"
>;

export function useLibraryTrackMutationActions({
  tracks,
  setTracks,
  setPlaylists,
  setSelectedTrackId,
  setMutating,
  setError,
}: TrackMutationActionsInput) {
  const mutationState = {
    setTracks,
    setPlaylists,
    setSelectedTrackId,
    setMutating,
    setError,
  };

  async function importLibraryTrack(input: ImportTrackInput): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => importLibraryTrackWithBackgroundAnalysis({ state: mutationState, importInput: input }),
      onSuccess: (nextTrack) => {
        if (nextTrack) {
          commitImportedTrack(mutationState, nextTrack);
        }
      },
      onErrorValue: null,
    });
  }

  async function reanalyzeTrack(trackId: string): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => reanalyzeLibraryTrack({ tracks, trackId }),
      onSuccess: (nextTrack) => {
        commitReplacedTrack(mutationState, trackId, nextTrack);
      },
      onErrorValue: null,
    });
  }

  async function seedLibrary(): Promise<void> {
    await runLibraryTrackMutation({
      state: mutationState,
      task: () => seedDemoTracks(),
      onSuccess: (nextTracks) => {
        commitSeededTracks(mutationState, nextTracks);
      },
      onErrorValue: undefined,
    });
  }

  async function deleteLibraryTrack(trackId: string): Promise<boolean> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: async () => {
        await deleteTrack(trackId);
        return true;
      },
      onSuccess: () => {
        commitDeletedTrack(mutationState, trackId);
      },
      onErrorValue: false,
      trackMutating: false,
    });
  }

  async function updateTrackPerformance(
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => persistTrackPerformance(trackId, input),
      onSuccess: (nextTrack) => {
        commitReplacedTrack(mutationState, trackId, nextTrack);
      },
      onErrorValue: null,
    });
  }

  async function updateTrackAnalysis(
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => persistTrackAnalysis(trackId, input),
      onSuccess: (nextTrack) => {
        commitReplacedTrack(mutationState, trackId, nextTrack);
      },
      onErrorValue: null,
    });
  }

  async function relinkTrack(trackId: string): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => relinkLibraryTrack({ tracks, trackId }),
      onSuccess: (nextTrack) => {
        if (nextTrack) {
          commitReplacedTrack(mutationState, trackId, nextTrack);
        }
      },
      onErrorValue: null,
    });
  }

  async function relinkMissingTracksFromDirectory(): Promise<RelinkMissingTracksResult | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: () => relinkMissingLibraryTracksFromDirectory({ tracks }),
      onSuccess: (result) => {
        if (result) {
          commitRelinkedTracks(mutationState, result);
        }
      },
      onErrorValue: null,
    });
  }

  return {
    importLibraryTrack,
    reanalyzeTrack,
    seedLibrary,
    deleteLibraryTrack,
    updateTrackPerformance,
    updateTrackAnalysis,
    relinkTrack,
    relinkMissingTracksFromDirectory,
  };
}
