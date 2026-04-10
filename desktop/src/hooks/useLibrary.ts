import { startTransition, useEffect, useState } from "react";

import {
  deleteBaseTrackPlaylist,
  listPlaylists,
  saveBaseTrackPlaylist,
  importTrack,
  listTracks,
  seedDemoTracks,
  deleteTrack,
  checkTrackExists,
  updateTrackAnalysis as persistTrackAnalysis,
  updateTrackPerformance as persistTrackPerformance,
} from "../api/library";
import { runAnalyzerRequest } from "../api/analyzer";
import { createAnalyzeTrackRequest } from "../contracts";
import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unexpected library failure.";
}

function sortTracks(tracks: LibraryTrack[]): LibraryTrack[] {
  return [...tracks].sort((left, right) =>
    right.analysis.importedAt.localeCompare(left.analysis.importedAt),
  );
}

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
        const [nextTracks, nextPlaylists] = await Promise.all([
          listTracks(),
          listPlaylists(),
        ]);

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortTracks(nextTracks);
          setTracks(sorted);
          setPlaylists(
            [...nextPlaylists].sort((left, right) =>
              right.updatedAt.localeCompare(left.updatedAt),
            ),
          );
          setSelectedTrackId((current) => {
            if (current && sorted.some((track) => track.id === current)) {
              return current;
            }

            return sorted[0]?.id ?? null;
          });
          setSelectedPlaylistId((current) => {
            if (
              current &&
              nextPlaylists.some((playlist) => playlist.id === current)
            ) {
              return current;
            }

            return nextPlaylists[0]?.id ?? null;
          });
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(toMessage(nextError));
          setLoading(false);
        });
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function importLibraryTrack(
    input: ImportTrackInput,
  ): Promise<LibraryTrack | null> {
    setMutating(true);

    try {
      const nextTrack = await importTrack(input);

      startTransition(() => {
        setTracks((current) =>
          sortTracks([
            nextTrack,
            ...current.filter((track) => track.id !== nextTrack.id),
          ]),
        );
        setSelectedTrackId(nextTrack.id);
        setError(null);
      });

      // Start background analysis without blocking or error handling
      if (nextTrack.analysis.analyzerStatus === "pending") {
        analyzeTrackBackground(nextTrack).catch((err) => {
          console.debug("Background analysis error (non-blocking):", err);
        });
      }

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
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
          setTracks((current) =>
            sortTracks(
              current.map((t) =>
                t.id === track.id
                  ? {
                      ...t,
                      analysis: {
                        ...t.analysis,
                        bpm: analyzed.suggestedBpm ?? t.analysis.bpm,
                        bpmConfidence: analyzed.confidence ?? t.analysis.bpmConfidence,
                        waveformBins:
                          analyzed.artifacts?.waveformBins ?? t.analysis.waveformBins,
                        beatGrid: analyzed.artifacts?.beatGrid ?? t.analysis.beatGrid,
                        bpmCurve: analyzed.artifacts?.bpmCurve ?? t.analysis.bpmCurve,
                      },
                      bpm: analyzed.suggestedBpm ?? t.analysis.bpm,
                      bpmConfidence: analyzed.confidence ?? t.analysis.bpmConfidence,
                      waveformBins:
                        analyzed.artifacts?.waveformBins ?? t.analysis.waveformBins,
                      beatGrid: analyzed.artifacts?.beatGrid ?? t.analysis.beatGrid,
                      bpmCurve: analyzed.artifacts?.bpmCurve ?? t.analysis.bpmCurve,
                    }
                  : t,
              ),
            ),
          );
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

      // Re-analyze using the same source path
      const input: ImportTrackInput = {
        title: track.tags.title,
        sourcePath: track.file.sourcePath,
        musicStyleId: track.tags.musicStyleId,
      };

      const nextTrack = await importTrack(input);

      startTransition(() => {
        setTracks((current) =>
          sortTracks(
            current.map((t) => (t.id === trackId ? nextTrack : t)),
          ),
        );
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
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
        const sorted = sortTracks(nextTracks);
        setTracks(sorted);
        setSelectedTrackId(sorted[0]?.id ?? null);
        setError(null);
      });
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
      });
    } finally {
      setMutating(false);
    }
  }

  async function deleteLibraryTrack(trackId: string): Promise<boolean> {
    try {
      await deleteTrack(trackId);

      startTransition(() => {
        setTracks((current) => current.filter((t) => t.id !== trackId));
        setPlaylists((current) =>
          current.map((playlist) => ({
            ...playlist,
            trackIds: playlist.trackIds.filter((id) => id !== trackId),
          })),
        );
        if (selectedTrackId === trackId) {
          setSelectedTrackId(null);
        }
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
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
        setTracks((current) =>
          sortTracks(
            current.map((track) => (track.id === trackId ? nextTrack : track)),
          ),
        );
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
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
        setTracks((current) =>
          sortTracks(
            current.map((track) => (track.id === trackId ? nextTrack : track)),
          ),
        );
        setError(null);
      });

      return nextTrack;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
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
        setPlaylists((current) =>
          [
            nextPlaylist,
            ...current.filter((playlist) => playlist.id !== nextPlaylist.id),
          ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
        );
        setSelectedPlaylistId(nextPlaylist.id);
        setError(null);
      });

      return nextPlaylist;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function deletePlaylist(
    playlistId: string,
  ): Promise<boolean> {
    setMutating(true);

    try {
      await deleteBaseTrackPlaylist(playlistId);

      startTransition(() => {
        setPlaylists((current) =>
          current.filter((playlist) => playlist.id !== playlistId),
        );
        if (selectedPlaylistId === playlistId) {
          setSelectedPlaylistId(null);
        }
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
      });
      return false;
    } finally {
      setMutating(false);
    }
  }

  const selectedTrack =
    tracks.find((track) => track.id === selectedTrackId) ?? null;
  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;

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
    seedLibrary,
    savePlaylist,
    deletePlaylist,
  };
}
