import { startTransition, useEffect, type Dispatch, type SetStateAction } from "react";

import { listRepositories } from "../api/repositories";
import type { RepositoryAnalysis } from "../types/library";
import {
  resolveSelectedRepositoryId,
  sortRepositoriesByImportedAt,
  toRepositoryErrorMessage,
} from "./repositoriesRuntime";

interface UseRepositoriesBootstrapInput {
  setRepositories: Dispatch<SetStateAction<RepositoryAnalysis[]>>;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function useRepositoriesBootstrap({
  setRepositories,
  setSelectedRepositoryId,
  setLoading,
  setError,
}: UseRepositoriesBootstrapInput) {
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
  }, [setError, setLoading, setRepositories, setSelectedRepositoryId]);
}
