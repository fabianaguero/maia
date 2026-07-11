import type { AppTranslations } from "../../i18n/types";
import type { CodeProject, CodeProjectFormDraft } from "../../types/codeProject";

export function resolveCodeProjectStatusClass(status: string): string {
  if (status === "ready") return "status-badge--ready";
  if (status === "testing") return "status-badge--testing";
  if (status === "error") return "status-badge--error";
  return "status-badge--not-configured";
}

export function resolveCodeProjectStatusLabel(
  status: string,
  t: AppTranslations,
): string {
  if (status === "ready") return t.simpleMode.codeProjects.ready;
  if (status === "testing") return t.simpleMode.codeProjects.testing;
  if (status === "error") return t.simpleMode.codeProjects.error;
  return t.simpleMode.codeProjects.notConfigured;
}

export function createEmptyCodeProjectDraft(): CodeProjectFormDraft {
  return {
    label: "",
    repositoryUrl: "",
    sonarqubeApiUrl: "",
    sonarqubeProjectKey: "",
    sonarqubeAuthToken: "",
    sonarqubePollingInterval: "30",
  };
}

export function createCodeProjectDraftFromProject(
  project: CodeProject,
): CodeProjectFormDraft {
  return {
    id: project.id,
    label: project.label,
    repositoryUrl: project.repositoryUrl,
    sonarqubeApiUrl: project.sonarqubeConfig?.apiUrl ?? "",
    sonarqubeProjectKey: project.sonarqubeConfig?.projectKey ?? "",
    sonarqubeAuthToken: project.sonarqubeConfig?.authToken ?? "",
    sonarqubePollingInterval: project.sonarqubeConfig?.pollingInterval ?? "30",
  };
}
