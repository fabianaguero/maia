import type { RepositoryAnalysis } from "../types/library";
import {
  commitDeletedRepository,
  commitImportedRepository,
  commitReanalyzedRepository,
  importRepositoryWithBackgroundAnalysis,
  reanalyzeImportedRepository,
  runRepositoryMutation,
  deleteImportedRepository,
} from "./repositoryMutationActionRuntime";
import type { UseRepositoryMutationActionsInput } from "./repositoryMutationActionsTypes";

export function useRepositoryMutationActions({
  repositories,
  setRepositories,
  setSelectedRepositoryId,
  setMutating,
  setError,
}: UseRepositoryMutationActionsInput) {
  const mutationState = {
    setRepositories,
    setSelectedRepositoryId,
    setMutating,
    setError,
  };

  async function importRepositorySource(input: {
    sourceKind: RepositoryAnalysis["sourceKind"];
    sourcePath: string;
    label?: string;
  }): Promise<RepositoryAnalysis | null> {
    return runRepositoryMutation({
      state: mutationState,
      task: () =>
        importRepositoryWithBackgroundAnalysis({
          state: mutationState,
          importInput: input,
        }),
      onSuccess: (nextRepository) => {
        if (nextRepository) {
          commitImportedRepository(mutationState, nextRepository);
        }
      },
      onErrorValue: null,
    });
  }

  async function reanalyzeRepository(repositoryId: string): Promise<RepositoryAnalysis | null> {
    return runRepositoryMutation({
      state: mutationState,
      task: () => reanalyzeImportedRepository({ repositories, repositoryId }),
      onSuccess: (nextRepository) => {
        commitReanalyzedRepository(mutationState, repositoryId, nextRepository);
      },
      onErrorValue: null,
    });
  }

  async function deleteLibraryRepository(repositoryId: string): Promise<boolean> {
    return runRepositoryMutation({
      state: mutationState,
      task: () => deleteImportedRepository(repositoryId),
      onSuccess: () => {
        commitDeletedRepository(mutationState, repositoryId);
      },
      onErrorValue: false,
      mutating: false,
    });
  }

  return {
    importRepositorySource,
    reanalyzeRepository,
    deleteLibraryRepository,
  };
}
