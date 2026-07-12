import type { AppTranslations } from "../../i18n/types";
import type {
  CodeProject,
  CodeProjectFormDraft,
  UpsertCodeProjectInput,
} from "../../types/codeProject";

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
    analysisMode: "local",
    sonarqubeApiUrl: "",
    sonarqubeProjectKey: "",
    sonarqubeAuthToken: "",
    sonarqubePollingInterval: "30",
    sonarqubeSyncRules: false,
    localRulesProfile: "maia-default",
  };
}

export function createCodeProjectDraftFromProject(
  project: CodeProject,
): CodeProjectFormDraft {
  return {
    id: project.id,
    label: project.label,
    repositoryUrl: project.repositoryUrl,
    analysisMode: project.analysisMode,
    sonarqubeApiUrl: project.sonarqubeConfig?.apiUrl ?? "",
    sonarqubeProjectKey: project.sonarqubeConfig?.projectKey ?? "",
    sonarqubeAuthToken: project.sonarqubeConfig?.authToken ?? "",
    sonarqubePollingInterval: project.sonarqubeConfig?.pollingInterval ?? "30",
    sonarqubeSyncRules: project.sonarqubeConfig?.syncRules ?? false,
    localRulesProfile: project.sonarqubeConfig?.localRulesProfile ?? "maia-default",
  };
}

export function createUpsertCodeProjectInputFromDraft(
  draft: CodeProjectFormDraft,
): UpsertCodeProjectInput {
  const isLocal = draft.analysisMode === "local";

  return {
    label: draft.label.trim(),
    repositoryUrl: draft.repositoryUrl.trim(),
    sonarqubeConfig: {
      analysisMode: draft.analysisMode,
      // Local mode must not retain stale remote credentials after switching from connected mode.
      apiUrl: isLocal ? "" : draft.sonarqubeApiUrl.trim(),
      projectKey: isLocal ? "" : draft.sonarqubeProjectKey.trim(),
      authToken: isLocal ? "" : draft.sonarqubeAuthToken.trim(),
      pollingInterval: draft.sonarqubePollingInterval.trim(),
      syncRules: isLocal ? false : draft.sonarqubeSyncRules,
      localRulesProfile: draft.localRulesProfile.trim(),
    },
  };
}
