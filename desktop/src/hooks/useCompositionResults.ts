import { startTransition, useEffect, useState } from "react";

import { importComposition, listCompositions } from "../api/compositions";
import type { CompositionResultRecord, ImportCompositionInput } from "../types/library";
import {
  appendImportedComposition,
  resolveSelectedCompositionId,
  sortCompositionsByImportedAt,
  toCompositionErrorMessage,
} from "./compositionResultsRuntime";

export function useCompositionResults() {
  const [compositions, setCompositions] = useState<CompositionResultRecord[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);
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
          const sorted = sortCompositionsByImportedAt(nextCompositions);
          setCompositions(sorted);
          setSelectedCompositionId((current) => resolveSelectedCompositionId(current, sorted));
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(toCompositionErrorMessage(nextError));
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
        setCompositions((current) => appendImportedComposition(current, nextComposition));
        setSelectedCompositionId(nextComposition.id);
        setError(null);
      });

      return nextComposition;
    } catch (nextError) {
      startTransition(() => {
        setError(toCompositionErrorMessage(nextError));
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
