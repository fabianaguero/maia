import { startTransition } from "react";
import type { Dispatch, SetStateAction } from "react";

import { runAnalyzerRequest } from "../api/analyzer";
import { checkRepositoryExists, deleteRepository, importRepository } from "../api/repositories";
import { createAnalyzeRepositoryRequest } from "../contracts";
import type { MusicalAsset } from "../contracts";
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

interface RepositoryMutationState {
  setRepositories: Dispatch<SetStateAction<RepositoryAnalysis[]>>;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  setMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export async function runRepositoryMutation<T, F>(input: {
  state: Pick<RepositoryMutationState, "setMutating" | "setError">;
  task: () => Promise<T>;
  onSuccess?: (value: T) => void;
  onErrorValue: F;
  mutating?: boolean;
}): Promise<T | F> {
  const { state, task, onSuccess, onErrorValue, mutating = true } = input;

  if (mutating) {
    state.setMutating(true);
  }

  try {
    const result = await task();
    startTransition(() => {
      onSuccess?.(result);
      state.setError(null);
    });
    return result;
  } catch (error) {
    startTransition(() => {
      state.setError(toRepositoryErrorMessage(error, "Unexpected repository failure."));
    });
    return onErrorValue;
  } finally {
    if (mutating) {
      state.setMutating(false);
    }
  }
}

export function commitImportedRepository(
  state: Pick<RepositoryMutationState, "setRepositories" | "setSelectedRepositoryId">,
  nextRepository: RepositoryAnalysis,
) {
  state.setRepositories((current) => appendImportedRepository(current, nextRepository));
  state.setSelectedRepositoryId(nextRepository.id);
}

export function commitAnalyzedRepositoryMetadata(
  state: Pick<RepositoryMutationState, "setRepositories">,
  repositoryId: string,
  analyzed: MusicalAsset,
) {
  state.setRepositories((current) =>
    applyAnalyzedRepositoryMetadata(current, repositoryId, analyzed),
  );
}

export function commitReanalyzedRepository(
  state: Pick<RepositoryMutationState, "setRepositories" | "setSelectedRepositoryId">,
  repositoryId: string,
  nextRepository: RepositoryAnalysis,
) {
  state.setRepositories((current) =>
    replaceReanalyzedRepository(current, repositoryId, nextRepository),
  );
  state.setSelectedRepositoryId(nextRepository.id);
}

export function commitDeletedRepository(
  state: Pick<RepositoryMutationState, "setRepositories" | "setSelectedRepositoryId">,
  repositoryId: string,
) {
  state.setRepositories((current) => removeDeletedRepository(current, repositoryId));
  state.setSelectedRepositoryId((current) =>
    clearDeletedSelectedRepositoryId(current, repositoryId),
  );
}

export async function analyzeRepositoryInBackground(
  state: Pick<RepositoryMutationState, "setRepositories">,
  repository: RepositoryAnalysis,
): Promise<void> {
  try {
    const request = createAnalyzeRepositoryRequest(repository.sourceKind, repository.sourcePath);
    const response = await runAnalyzerRequest(request);
    const analyzed = resolveRepositoryAnalysisPayload(response);
    if (!analyzed) {
      return;
    }

    startTransition(() => {
      commitAnalyzedRepositoryMetadata(state, repository.id, analyzed);
    });
  } catch (error) {
    console.debug("Background analysis failed:", error);
  }
}

export async function importRepositoryWithBackgroundAnalysis(input: {
  state: Pick<RepositoryMutationState, "setRepositories">;
  importInput: {
    sourceKind: RepositoryAnalysis["sourceKind"];
    sourcePath: string;
    label?: string;
  };
}): Promise<RepositoryAnalysis | null> {
  const nextRepository = await importRepository(input.importInput);
  if (nextRepository && shouldAnalyzeImportedRepository(nextRepository)) {
    void analyzeRepositoryInBackground(input.state, nextRepository).catch((error) => {
      console.debug("Background analysis error (non-blocking):", error);
    });
  }
  return nextRepository;
}

export async function reanalyzeImportedRepository(input: {
  repositories: RepositoryAnalysis[];
  repositoryId: string;
}): Promise<RepositoryAnalysis> {
  const repository = input.repositories.find((entry) => entry.id === input.repositoryId);
  if (!repository) {
    throw new Error("Repository not found");
  }

  const sourceExists = await checkRepositoryExists(repository.sourcePath);
  if (!sourceExists) {
    throw new Error(`Repository source not found: ${repository.sourcePath}`);
  }

  return importRepository(resolveReanalyzeRepositoryInput(repository));
}

export async function deleteImportedRepository(repositoryId: string): Promise<boolean> {
  await deleteRepository(repositoryId);
  return true;
}
