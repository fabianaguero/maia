import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import type { CodeProject, UpsertCodeProjectInput } from "../../types/codeProject";

interface UseCodeProjectsStateResult {
  projects: CodeProject[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (label: string, repoUrl: string) => Promise<CodeProject>;
  updateProject: (id: string, input: UpsertCodeProjectInput) => Promise<CodeProject>;
  deleteProject: (id: string) => Promise<void>;
  testConnection: (
    apiUrl: string,
    projectKey: string,
    authToken: string,
  ) => Promise<{ valid: boolean; error?: string; issueCount?: number }>;
}

export function useCodeProjectsState(): UseCodeProjectsStateResult {
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<CodeProject[]>("list_code_projects");
      setProjects(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProject = useCallback(
    async (label: string, repoUrl: string): Promise<CodeProject> => {
      try {
        setError(null);
        const input: UpsertCodeProjectInput = {
          label: label.trim(),
          repositoryUrl: repoUrl.trim(),
        };
        const result = await invoke<CodeProject>("create_code_project", { input });
        await refresh();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const updateProject = useCallback(
    async (id: string, input: UpsertCodeProjectInput): Promise<CodeProject> => {
      try {
        setError(null);
        const result = await invoke<CodeProject>("update_code_project", { id, input });
        await refresh();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await invoke("delete_code_project", { id });
        await refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const testConnection = useCallback(
    async (apiUrl: string, projectKey: string, authToken: string) => {
      try {
        const config = {
          apiUrl: apiUrl.trim(),
          projectKey: projectKey.trim(),
          authToken: authToken.trim(),
          pollingInterval: "30",
        };
        const result = await invoke<{
          valid: boolean;
          error?: string;
          issue_count?: number;
        }>("test_sonarqube_connection", { config });
        return {
          valid: result.valid,
          error: result.error,
          issueCount: result.issue_count,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          valid: false,
          error: message,
        };
      }
    },
    [],
  );

  return {
    projects,
    loading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    testConnection,
  };
}
