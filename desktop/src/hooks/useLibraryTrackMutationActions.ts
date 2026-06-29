import { startTransition } from "react";

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
import type { UseLibraryMutationActionsInput } from "./libraryMutationActionsTypes";

type TrackMutationActionsInput = Pick<
  UseLibraryMutationActionsInput,
  | "tracks"
  | "setTracks"
  | "setPlaylists"
  | "setSelectedTrackId"
  | "setMutating"
  | "setError"
>;

export function useLibraryTrackMutationActions({
  tracks,
  setTracks,
  setPlaylists,
  setSelectedTrackId,
  setMutating,
  setError,
}: TrackMutationActionsInput) {
  async function analyzeTrackBackground(track: LibraryTrack): Promise<void> {
    try {
      const request = createAnalyzeTrackRequest(track.file.sourcePath);
      const response = await runAnalyzerRequest(request);

      if (response.status === "ok" && "musicalAsset" in response.payload) {
        const analyzed = response.payload.musicalAsset;
        startTransition(() => {
          setTracks((current) => applyAnalyzedTrackMetadata(current, track.id, analyzed));
        });
      }
    } catch (error) {
      console.debug("Background analysis failed:", error);
    }
  }

  async function importLibraryTrack(input: ImportTrackInput): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const nextTrack = await importTrack(input);

      startTransition(() => {
        setTracks((current) => appendImportedTrack(current, nextTrack));
        setSelectedTrackId(nextTrack.id);
        setError(null);
      });

      if (shouldAnalyzeImportedTrack(nextTrack)) {
        analyzeTrackBackground(nextTrack).catch((error) => {
          console.debug("Background analysis error (non-blocking):", error);
        });
      }

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function reanalyzeTrack(trackId: string): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const track = tracks.find((entry) => entry.id === trackId);
      if (!track) {
        throw new Error("Track not found");
      }

      const fileExists = await checkTrackExists(track.file.sourcePath);
      if (!fileExists) {
        throw new Error(`Track file not found: ${track.file.sourcePath}`);
      }

      const nextTrack = await importTrack(resolveReanalyzeTrackInput(track));

      startTransition(() => {
        setTracks((current) => replaceTrack(current, trackId, nextTrack));
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function seedLibrary(): Promise<void> {
    setMutating(true);

    try {
      const nextTracks = await seedDemoTracks();

      startTransition(() => {
        const sorted = sortTracksByImportedAt(nextTracks);
        setTracks(sorted);
        setSelectedTrackId(sorted[0]?.id ?? null);
        setError(null);
      });
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
    } finally {
      setMutating(false);
    }
  }

  async function deleteLibraryTrack(trackId: string): Promise<boolean> {
    try {
      await deleteTrack(trackId);

      startTransition(() => {
        setTracks((current) => removeDeletedTrack(current, trackId));
        setPlaylists((current) => removeTrackFromPlaylists(current, trackId));
        setSelectedTrackId((current) => clearDeletedTrackSelection(current, trackId));
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return false;
    }
  }

  async function updateTrackPerformance(
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const nextTrack = await persistTrackPerformance(trackId, input);

      startTransition(() => {
        setTracks((current) => replaceTrack(current, trackId, nextTrack));
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function updateTrackAnalysis(
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const nextTrack = await persistTrackAnalysis(trackId, input);

      startTransition(() => {
        setTracks((current) => replaceTrack(current, trackId, nextTrack));
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function relinkTrack(trackId: string): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const track = tracks.find((entry) => entry.id === trackId) ?? null;
      if (!track) {
        throw new Error("Track not found");
      }

      const pickedPath = await pickTrackSourcePath(track.file.sourcePath);
      if (!pickedPath) {
        return null;
      }

      const input: UpdateTrackSourceInput = { sourcePath: pickedPath };
      const nextTrack = await persistTrackSource(trackId, input);

      startTransition(() => {
        setTracks((current) => replaceTrack(current, trackId, nextTrack));
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function relinkMissingTracksFromDirectory(): Promise<RelinkMissingTracksResult | null> {
    setMutating(true);

    try {
      const firstMissingTrack =
        tracks.find((track) => track.file.availabilityState === "missing") ?? null;
      const pickedDirectory = await pickTrackSourceDirectory(
        firstMissingTrack?.file.sourcePath ?? undefined,
      );
      if (!pickedDirectory) {
        return null;
      }

      const result = await persistMissingTrackRelink(pickedDirectory);

      startTransition(() => {
        setTracks((current) => replaceRelinkedTracks(current, result));
        const preferredSelection = resolvePreferredRelinkSelection(result);
        if (preferredSelection) {
          setSelectedTrackId(preferredSelection);
        }
        setError(null);
      });

      return result;
    } catch (nextError) {
      startTransition(() => {
        setError(toLibraryErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
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
