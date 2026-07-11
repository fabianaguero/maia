import type { AppTranslations } from "../../i18n/types";
import type { UpsertLogSourceConnectionInput } from "../../types/monitor";
import { deriveFileConnectionLabel, type ConnectionDraft } from "./connectionsDraftRuntime";

export function buildConnectionUpsertInput(input: {
  draft: ConnectionDraft;
  editingConnectionId: string | null;
  t: AppTranslations;
}): { ok: true; value: UpsertLogSourceConnectionInput } | { ok: false; error: string } {
  const { draft, editingConnectionId, t } = input;

  if (draft.kind === "file_log") {
    const normalizedPath = draft.sourcePath.trim();
    if (!normalizedPath) {
      return {
        ok: false,
        error: t.simpleMode.connections.chooseLogFileError,
      };
    }

    return {
      ok: true,
      value: {
        id: editingConnectionId ?? undefined,
        kind: "file_log",
        label: draft.label.trim() || deriveFileConnectionLabel(normalizedPath),
        sourceUri: normalizedPath,
        config: {
          path: normalizedPath,
        },
      },
    };
  }

  if (draft.kind === "sonarqube") {
    const apiUrl = draft.sonarqubeApiUrl.trim();
    const projectKey = draft.sonarqubeProjectKey.trim();
    const authToken = draft.sonarqubeAuthToken.trim();
    if (!apiUrl || !projectKey || !authToken) {
      return {
        ok: false,
        error: "SonarQube requires server URL, project key, and authentication token.",
      };
    }

    return {
      ok: true,
      value: {
        id: editingConnectionId ?? undefined,
        kind: "sonarqube",
        label: draft.label.trim() || `${projectKey} · SonarQube`,
        sourceUri: `sonarqube://${projectKey}`,
        config: {
          apiUrl,
          projectKey,
          authToken,
          pollingInterval: draft.sonarqubePollingInterval || "30",
        },
      },
    };
  }

  const projectId = draft.gcpProjectId.trim();
  const serviceName = draft.gcpServiceName.trim();
  const region = draft.gcpRegion.trim();
  const backfillFreshness = draft.gcpBackfillFreshness.trim() || "10m";
  if (!projectId || !serviceName) {
    return {
      ok: false,
      error: t.simpleMode.connections.gcpRequiresProjectAndService,
    };
  }

  return {
    ok: true,
    value: {
      id: editingConnectionId ?? undefined,
      kind: "gcp_cloud_run",
      label:
        draft.label.trim() || `${serviceName} · ${t.simpleMode.connections.cloudRunLabelSuffix}`,
      sourceUri: region
        ? `gcp-cloud-run://${projectId}/${region}/${serviceName}`
        : `gcp-cloud-run://${projectId}/${serviceName}`,
      config: {
        projectId,
        serviceName,
        region: region || undefined,
        minimumSeverity: "DEFAULT",
        backfillFreshness,
      },
    },
  };
}
