import { startTransition, useEffect, useState } from "react";

import { importTrack, listTracks, seedDemoTracks } from "../api/library";
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
    seedLibrary,
  };
}

