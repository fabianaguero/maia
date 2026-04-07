import { startTransition, useEffect, useState } from "react";

import { importTrack, listTracks, seedDemoTracks, deleteTrack, checkTrackExists } from "../api/library";
import { runAnalyzerRequest } from "../api/analyzer";
import { createAnalyzeTrackRequest } from "../contracts";
import type { ImportTrackInput, LibraryTrack } from "../types/library";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected library failure.";
}

function sortTracks(tracks: LibraryTrack[]): LibraryTrack[] {
  return [...tracks].sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextTracks = await listTracks();

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortTracks(nextTracks);
          setTracks(sorted);
          setSelectedTrackId((current) => {
            if (current && sorted.some((track) => track.id === current)) {
              return current;
            }

            return sorted[0]?.id ?? null;
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
      if (nextTrack.analyzerStatus === "pending") {
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
      const request = createAnalyzeTrackRequest(track.sourcePath);
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
                      bpm: analyzed.suggestedBpm ?? t.bpm,
                      bpmConfidence: analyzed.confidence ?? t.bpmConfidence,
                      waveformBins: analyzed.artifacts?.waveformBins ?? t.waveformBins,
                      beatGrid: analyzed.artifacts?.beatGrid ?? t.beatGrid,
                      bpmCurve: analyzed.artifacts?.bpmCurve ?? t.bpmCurve,
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
      const fileExists = await checkTrackExists(track.sourcePath);
      if (!fileExists) {
        throw new Error(`Track file not found: ${track.sourcePath}`);
      }

      // Re-analyze using the same source path
      const input: ImportTrackInput = {
        title: track.title,
        sourcePath: track.sourcePath,
        musicStyleId: track.musicStyleId,
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

  const selectedTrack =
    tracks.find((track) => track.id === selectedTrackId) ?? null;

  return {
    tracks,
    selectedTrack,
    selectedTrackId,
    setSelectedTrackId,
    loading,
    mutating,
    error,
    importLibraryTrack,
    reanalyzeTrack,
    deleteLibraryTrack,
    seedLibrary,
  };
}

