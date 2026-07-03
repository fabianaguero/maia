import { useMemo, useState } from "react";

import type { RepositoryAnalysis } from "../types/library";
import { useRepositoriesBootstrap } from "./useRepositoriesBootstrap";
import { useRepositoryMutationActions } from "./useRepositoryMutationActions";

export function useRepositories() {
  const [repositories, setRepositories] = useState<RepositoryAnalysis[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRepositoriesBootstrap({
    setRepositories,
    setSelectedRepositoryId,
    setLoading,
    setError,
  });

  const actions = useRepositoryMutationActions({
    repositories,
    setRepositories,
    setSelectedRepositoryId,
    setMutating,
    setError,
  });

  const selectedRepository = useMemo(
    () => repositories.find((repository) => repository.id === selectedRepositoryId) ?? null,
    [repositories, selectedRepositoryId],
  );

  return {
    repositories,
    selectedRepository,
    selectedRepositoryId,
    setSelectedRepositoryId,
    loading,
    mutating,
    error,
    ...actions,
  };
}
