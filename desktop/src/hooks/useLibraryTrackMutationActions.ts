import { runAnalyzerRequest } from "../api/analyzer";
import {
  checkTrackExists,
  deleteTrack,
  importTrack,
  pickTrackSourceDirectory,
  pickTrackSourcePath,
  resolveMissingTracksFromDirectory as persistMissingTrackRelink,
  seedDemoTracks,
  updateTrackAnalysis as persistTrackAnalysis,
  updateTrackPerformance as persistTrackPerformance,
  updateTrackSource as persistTrackSource,
} from "../api/library";
import { createAnalyzeTrackRequest } from "../contracts";
import type {
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
  UpdateTrackSourceInput,
} from "../types/library";
import { resolveReanalyzeTrackInput, shouldAnalyzeImportedTrack } from "./libraryRuntime";
import {
  commitAnalyzedTrackMetadata,
  commitDeletedTrack,
  commitImportedTrack,
  commitRelinkedTracks,
  commitReplacedTrack,
  commitSeededTracks,
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

  async function analyzeTrackBackground(track: LibraryTrack): Promise<void> {
    try {
      const request = createAnalyzeTrackRequest(track.file.sourcePath);
      const response = await runAnalyzerRequest(request);

      if (response.status === "ok" && "musicalAsset" in response.payload) {
        const analyzed = response.payload.musicalAsset;
        commitAnalyzedTrackMetadata(mutationState, track.id, analyzed);
      }
    } catch (error) {
      console.debug("Background analysis failed:", error);
    }
  }

  async function importLibraryTrack(input: ImportTrackInput): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: async () => {
        const nextTrack = await importTrack(input);
        if (shouldAnalyzeImportedTrack(nextTrack)) {
          void analyzeTrackBackground(nextTrack);
        }
        return nextTrack;
      },
      onSuccess: (nextTrack) => {
        commitImportedTrack(mutationState, nextTrack);
      },
      onErrorValue: null,
    });
  }

  async function reanalyzeTrack(trackId: string): Promise<LibraryTrack | null> {
    return runLibraryTrackMutation({
      state: mutationState,
      task: async () => {
        const track = tracks.find((entry) => entry.id === trackId);
        if (!track) {
          throw new Error("Track not found");
        }

        const fileExists = await checkTrackExists(track.file.sourcePath);
        if (!fileExists) {
          throw new Error(`Track file not found: ${track.file.sourcePath}`);
        }

        return importTrack(resolveReanalyzeTrackInput(track));
      },
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
      task: async () => {
        const track = tracks.find((entry) => entry.id === trackId) ?? null;
        if (!track) {
          throw new Error("Track not found");
        }

        const pickedPath = await pickTrackSourcePath(track.file.sourcePath);
        if (!pickedPath) {
          return null;
        }

        const input: UpdateTrackSourceInput = { sourcePath: pickedPath };
        return persistTrackSource(trackId, input);
      },
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
      task: async () => {
        const firstMissingTrack =
          tracks.find((track) => track.file.availabilityState === "missing") ?? null;
        const pickedDirectory = await pickTrackSourceDirectory(
          firstMissingTrack?.file.sourcePath ?? undefined,
        );
        if (!pickedDirectory) {
          return null;
        }

        return persistMissingTrackRelink(pickedDirectory);
      },
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
