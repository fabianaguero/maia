import type { Dispatch, SetStateAction } from "react";

import type { RepositoryAnalysis } from "../types/library";

export interface UseRepositoryMutationActionsInput {
  repositories: RepositoryAnalysis[];
  setRepositories: Dispatch<SetStateAction<RepositoryAnalysis[]>>;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  setMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}
