import { startTransition, useEffect, useState } from "react";

import {
  importRepository,
  listRepositories,
  deleteRepository,
  checkRepositoryExists,
} from "../api/repositories";
import { runAnalyzerRequest } from "../api/analyzer";
import { createAnalyzeRepositoryRequest } from "../contracts";
import type {
  ImportRepositoryInput,
  RepositoryAnalysis,
} from "../types/library";

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
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
          setError(toMessage(nextError, "Unexpected repository failure."));
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

      // Start background analysis without blocking or error handling
      if (nextRepository.analyzerStatus === "pending") {
        analyzeRepositoryBackground(nextRepository).catch((err) => {
          console.debug("Background analysis error (non-blocking):", err);
        });
      }

      return nextRepository;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError, "Unexpected repository failure."));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function analyzeRepositoryBackground(repository: RepositoryAnalysis): Promise<void> {
    try {
      const request = createAnalyzeRepositoryRequest(repository.sourceKind, repository.sourcePath);
      const response = await runAnalyzerRequest(request);

      if (response.status === "ok" && "musicalAsset" in response.payload) {
        const analyzed = response.payload.musicalAsset;
        // Just update metadata, don't change analyzerStatus
        // Status change requires re-import from backend to persist to DB
        startTransition(() => {
          setRepositories((current) =>
            sortRepositories(
              current.map((r) =>
                r.id === repository.id
                  ? {
                      ...r,
                      suggestedBpm: analyzed.suggestedBpm ?? r.suggestedBpm,
                      confidence: analyzed.confidence ?? r.confidence,
                      waveformBins: analyzed.artifacts?.waveformBins ?? r.waveformBins,
                      beatGrid: analyzed.artifacts?.beatGrid ?? r.beatGrid,
                      bpmCurve: analyzed.artifacts?.bpmCurve ?? r.bpmCurve,
                    }
                  : r,
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

  async function reanalyzeRepository(repositoryId: string): Promise<RepositoryAnalysis | null> {
    setMutating(true);

    try {
      const repository = repositories.find((r) => r.id === repositoryId);
      if (!repository) throw new Error("Repository not found");

      // Check if file/directory exists before analyzing
      const sourceExists = await checkRepositoryExists(repository.sourcePath);
      if (!sourceExists) {
        throw new Error(`Repository source not found: ${repository.sourcePath}`);
      }

      // Re-analyze using the same source path
      const input: ImportRepositoryInput = {
        sourceKind: repository.sourceKind,
        sourcePath: repository.sourcePath,
        label: repository.title,
      };

      const nextRepository = await importRepository(input);

      startTransition(() => {
        setRepositories((current) =>
          sortRepositories(
            current.map((r) => (r.id === repositoryId ? nextRepository : r)),
          ),
        );
        setError(null);
      });

      return nextRepository;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError, "Unexpected repository failure."));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function deleteLibraryRepository(repositoryId: string): Promise<boolean> {
    try {
      await deleteRepository(repositoryId);

      startTransition(() => {
        setRepositories((current) => current.filter((r) => r.id !== repositoryId));
        if (selectedRepositoryId === repositoryId) {
          setSelectedRepositoryId(null);
        }
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError, "Unexpected repository failure."));
      });
      return false;
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
    reanalyzeRepository,
    deleteLibraryRepository,
  };
}
