import { startTransition, useEffect, useState } from "react";

import {
  deleteBaseTrackPlaylist,
  listPlaylists,
  saveBaseTrackPlaylist,
  importTrack,
  listTracks,
  pickTrackSourceDirectory,
  seedDemoTracks,
  resolveMissingTracksFromDirectory as persistMissingTrackRelink,
  deleteTrack,
  checkTrackExists,
  pickTrackSourcePath,
  updateTrackAnalysis as persistTrackAnalysis,
  updateTrackPerformance as persistTrackPerformance,
  updateTrackSource as persistTrackSource,
} from "../api/library";
import { runAnalyzerRequest } from "../api/analyzer";
import { createAnalyzeTrackRequest } from "../contracts";
import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
  UpdateTrackSourceInput,
} from "../types/library";
import {
  appendImportedTrack,
  appendSavedPlaylist,
  applyAnalyzedTrackMetadata,
  clearDeletedPlaylistSelection,
  clearDeletedTrackSelection,
  removeDeletedPlaylist,
  removeDeletedTrack,
  removeTrackFromPlaylists,
  replaceRelinkedTracks,
  replaceTrack,
  resolvePreferredRelinkSelection,
  resolveReanalyzeTrackInput,
  resolveSelectedPlaylistId,
  resolveSelectedTrackId,
  shouldAnalyzeImportedTrack,
  sortPlaylistsByUpdatedAt,
  sortTracksByImportedAt,
  toLibraryErrorMessage,
} from "./libraryRuntime";

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [playlists, setPlaylists] = useState<BaseTrackPlaylist[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setSelectedPlaylistId((current) =>
            resolveSelectedPlaylistId(current, sortedPlaylists),
          );
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
  }, []);

  async function importLibraryTrack(input: ImportTrackInput): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const nextTrack = await importTrack(input);

      startTransition(() => {
        setTracks((current) => appendImportedTrack(current, nextTrack));
        setSelectedTrackId(nextTrack.id);
        setError(null);
      });

      // Start background analysis without blocking or error handling
      if (shouldAnalyzeImportedTrack(nextTrack)) {
        analyzeTrackBackground(nextTrack).catch((err) => {
          console.debug("Background analysis error (non-blocking):", err);
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

  async function analyzeTrackBackground(track: LibraryTrack): Promise<void> {
    try {
      const request = createAnalyzeTrackRequest(track.file.sourcePath);
      const response = await runAnalyzerRequest(request);

      if (response.status === "ok" && "musicalAsset" in response.payload) {
        const analyzed = response.payload.musicalAsset;
        // Just update metadata, don't change analyzerStatus
        // Status change requires re-import from backend to persist to DB
        startTransition(() => {
          setTracks((current) => applyAnalyzedTrackMetadata(current, track.id, analyzed));
        });
      }
    } catch (err) {
      // Silent fail — analysis in background doesn't block user
      console.debug("Background analysis failed:", err);
    }
  }

  async function reanalyzeTrack(trackId: string): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) throw new Error("Track not found");

      // Check if file exists before analyzing
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

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;
  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;

  return {
    tracks,
    playlists,
    selectedTrack,
    selectedPlaylist,
    selectedTrackId,
    selectedPlaylistId,
    setSelectedTrackId,
    setSelectedPlaylistId,
    loading,
    mutating,
    error,
    importLibraryTrack,
    reanalyzeTrack,
    deleteLibraryTrack,
    updateTrackPerformance,
    updateTrackAnalysis,
    relinkTrack,
    relinkMissingTracksFromDirectory,
    seedLibrary,
    savePlaylist,
    deletePlaylist,
  };
}
