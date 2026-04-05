import { startTransition, useEffect, useState } from "react";

import {
  importComposition,
  listCompositions,
} from "../api/compositions";
import type {
  CompositionResultRecord,
  ImportCompositionInput,
} from "../types/library";

function toMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected composition failure.";
}

function sortCompositions(
  compositions: CompositionResultRecord[],
): CompositionResultRecord[] {
  return [...compositions].sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export function useCompositionResults() {
  const [compositions, setCompositions] = useState<CompositionResultRecord[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextCompositions = await listCompositions();

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortCompositions(nextCompositions);
          setCompositions(sorted);
          setSelectedCompositionId((current) => {
            if (current && sorted.some((entry) => entry.id === current)) {
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

  async function importLibraryComposition(
    input: ImportCompositionInput,
  ): Promise<CompositionResultRecord | null> {
    setMutating(true);

    try {
      const nextComposition = await importComposition(input);

      startTransition(() => {
        setCompositions((current) =>
          sortCompositions([
            nextComposition,
            ...current.filter((entry) => entry.id !== nextComposition.id),
          ]),
        );
        setSelectedCompositionId(nextComposition.id);
        setError(null);
      });

      return nextComposition;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  const selectedComposition =
    compositions.find((entry) => entry.id === selectedCompositionId) ?? null;

  return {
    compositions,
    selectedComposition,
    selectedCompositionId,
    setSelectedCompositionId,
    loading,
    mutating,
    error,
    importLibraryComposition,
  };
}
