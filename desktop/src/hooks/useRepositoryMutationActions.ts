import { startTransition } from "react";

import { runAnalyzerRequest } from "../api/analyzer";
import { checkRepositoryExists, deleteRepository, importRepository } from "../api/repositories";
import { createAnalyzeRepositoryRequest } from "../contracts";
import type { RepositoryAnalysis } from "../types/library";
import {
  appendImportedRepository,
  applyAnalyzedRepositoryMetadata,
  clearDeletedSelectedRepositoryId,
  removeDeletedRepository,
  replaceReanalyzedRepository,
  resolveReanalyzeRepositoryInput,
  resolveRepositoryAnalysisPayload,
  shouldAnalyzeImportedRepository,
  toRepositoryErrorMessage,
} from "./repositoriesRuntime";
import type { UseRepositoryMutationActionsInput } from "./repositoryMutationActionsTypes";

export function useRepositoryMutationActions({
  repositories,
  setRepositories,
  setSelectedRepositoryId,
  setMutating,
  setError,
}: UseRepositoryMutationActionsInput) {
  async function analyzeRepositoryBackground(repository: RepositoryAnalysis): Promise<void> {
    try {
      const request = createAnalyzeRepositoryRequest(repository.sourceKind, repository.sourcePath);
      const response = await runAnalyzerRequest(request);
      const analyzed = resolveRepositoryAnalysisPayload(response);
      if (!analyzed) {
        return;
      }

      startTransition(() => {
        setRepositories((current) =>
          applyAnalyzedRepositoryMetadata(current, repository.id, analyzed),
        );
      });
    } catch (error) {
      console.debug("Background analysis failed:", error);
    }
  }

  async function importRepositorySource(input: {
    sourceKind: RepositoryAnalysis["sourceKind"];
    sourcePath: string;
    label?: string;
  }): Promise<RepositoryAnalysis | null> {
    setMutating(true);

    try {
      const nextRepository = await importRepository(input);

      startTransition(() => {
        setRepositories((current) => appendImportedRepository(current, nextRepository));
        setSelectedRepositoryId(nextRepository.id);
        setError(null);
      });

      if (shouldAnalyzeImportedRepository(nextRepository)) {
        analyzeRepositoryBackground(nextRepository).catch((error) => {
          console.debug("Background analysis error (non-blocking):", error);
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

  async function reanalyzeRepository(repositoryId: string): Promise<RepositoryAnalysis | null> {
    setMutating(true);

    try {
      const repository = repositories.find((entry) => entry.id === repositoryId);
      if (!repository) {
        throw new Error("Repository not found");
      }

      const sourceExists = await checkRepositoryExists(repository.sourcePath);
      if (!sourceExists) {
        throw new Error(`Repository source not found: ${repository.sourcePath}`);
      }

      const nextRepository = await importRepository(resolveReanalyzeRepositoryInput(repository));

      startTransition(() => {
        setRepositories((current) =>
          replaceReanalyzedRepository(current, repositoryId, nextRepository),
        );
        setSelectedRepositoryId(nextRepository.id);
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

  return {
    importRepositorySource,
    reanalyzeRepository,
    deleteLibraryRepository,
  };
}
