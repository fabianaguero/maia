import { startTransition, useEffect, useState } from "react";

import {
  importRepository,
  listRepositories,
  deleteRepository,
  checkRepositoryExists,
} from "../api/repositories";
import { runAnalyzerRequest } from "../api/analyzer";
import { createAnalyzeRepositoryRequest } from "../contracts";
import type { ImportRepositoryInput, RepositoryAnalysis } from "../types/library";
import {
  appendImportedRepository,
  applyAnalyzedRepositoryMetadata,
  clearDeletedSelectedRepositoryId,
  removeDeletedRepository,
  replaceReanalyzedRepository,
  resolveReanalyzeRepositoryInput,
  resolveRepositoryAnalysisPayload,
  resolveSelectedRepositoryId,
  shouldAnalyzeImportedRepository,
  sortRepositoriesByImportedAt,
  toRepositoryErrorMessage,
} from "./repositoriesRuntime";

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
          const sorted = sortRepositoriesByImportedAt(nextRepositories);
          setRepositories(sorted);
          setSelectedRepositoryId((current) => resolveSelectedRepositoryId(current, sorted));
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(toRepositoryErrorMessage(nextError, "Unexpected repository failure."));
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
        setRepositories((current) => appendImportedRepository(current, nextRepository));
        setSelectedRepositoryId(nextRepository.id);
        setError(null);
      });

      // Start background analysis without blocking or error handling
      if (shouldAnalyzeImportedRepository(nextRepository)) {
        analyzeRepositoryBackground(nextRepository).catch((err) => {
          console.debug("Background analysis error (non-blocking):", err);
        });
      }

      return nextRepository;
    } catch (nextError) {
      startTransition(() => {
        setError(toRepositoryErrorMessage(nextError, "Unexpected repository failure."));
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
      const analyzed = resolveRepositoryAnalysisPayload(response);
      if (analyzed) {
        // Just update metadata, don't change analyzerStatus
        // Status change requires re-import from backend to persist to DB
        startTransition(() => {
          setRepositories((current) =>
            applyAnalyzedRepositoryMetadata(current, repository.id, analyzed),
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

      const nextRepository = await importRepository(resolveReanalyzeRepositoryInput(repository));

      startTransition(() => {
        setRepositories((current) =>
          replaceReanalyzedRepository(current, repositoryId, nextRepository),
        );
        setError(null);
      });

      return nextRepository;
    } catch (nextError) {
      startTransition(() => {
        setError(toRepositoryErrorMessage(nextError, "Unexpected repository failure."));
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
        setRepositories((current) => removeDeletedRepository(current, repositoryId));
        setSelectedRepositoryId((current) =>
          clearDeletedSelectedRepositoryId(current, repositoryId),
        );
        setError(null);
      });

      return true;
    } catch (nextError) {
      startTransition(() => {
        setError(toRepositoryErrorMessage(nextError, "Unexpected repository failure."));
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
