import { startTransition, useEffect, useState } from "react";

import {
  importRepository,
  listRepositories,
} from "../api/repositories";
import type {
  ImportRepositoryInput,
  RepositoryAnalysis,
} from "../types/library";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected repository failure.";
}

function sortRepositories(
  repositories: RepositoryAnalysis[],
): RepositoryAnalysis[] {
  return [...repositories].sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export function useRepositories() {
  const [repositories, setRepositories] = useState<RepositoryAnalysis[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextRepositories = await listRepositories();

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortRepositories(nextRepositories);
          setRepositories(sorted);
          setSelectedRepositoryId((current) => {
            if (current && sorted.some((repository) => repository.id === current)) {
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

  async function importRepositorySource(
    input: ImportRepositoryInput,
  ): Promise<RepositoryAnalysis | null> {
    setMutating(true);

    try {
      const nextRepository = await importRepository(input);

      startTransition(() => {
        setRepositories((current) =>
          sortRepositories([
            nextRepository,
            ...current.filter((repository) => repository.id !== nextRepository.id),
          ]),
        );
        setSelectedRepositoryId(nextRepository.id);
        setError(null);
      });

      return nextRepository;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  const selectedRepository =
    repositories.find((repository) => repository.id === selectedRepositoryId) ?? null;

  return {
    repositories,
    selectedRepository,
    selectedRepositoryId,
    setSelectedRepositoryId,
    loading,
    mutating,
    error,
    importRepositorySource,
  };
}
