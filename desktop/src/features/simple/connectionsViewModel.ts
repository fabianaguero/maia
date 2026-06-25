import type { AppTranslations } from "../../i18n/en";
import type {
  LogSourceConnection,
  LogSourceConnectionKind,
  UpsertLogSourceConnectionInput,
} from "../../types/library";

export type ConnectionKind = LogSourceConnectionKind;
export type ConnectionTestStatus = "idle" | "testing" | "success" | "error";

export interface ConnectionDraft {
  kind: ConnectionKind;
  label: string;
  sourcePath: string;
  gcpProjectId: string;
  gcpServiceName: string;
  gcpRegion: string;
  gcpBackfillFreshness: string;
}

export function createEmptyConnectionDraft(): ConnectionDraft {
  return {
    kind: "file_log",
    label: "",
    sourcePath: "",
    gcpProjectId: "",
    gcpServiceName: "",
    gcpRegion: "",
    gcpBackfillFreshness: "10m",
  };
}

export function readConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function deriveFileConnectionLabel(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "log-file";
  const parts = trimmed.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

export function createConnectionDraftFromConnection(
  connection: LogSourceConnection,
): ConnectionDraft {
  return {
    kind: connection.kind,
    label: connection.label,
    sourcePath: readConfigString(connection.config, "path") ?? connection.sourceUri,
    gcpProjectId: readConfigString(connection.config, "projectId") ?? "",
    gcpServiceName: readConfigString(connection.config, "serviceName") ?? "",
    gcpRegion: readConfigString(connection.config, "region") ?? "",
    gcpBackfillFreshness: readConfigString(connection.config, "backfillFreshness") ?? "10m",
  };
}

export function deriveCloudBackfillLabel(connection: LogSourceConnection): string | null {
  if (connection.kind !== "gcp_cloud_run") return null;
  const configured = readConfigString(connection.config, "backfillFreshness");
  if (!configured) return "10m";
  if (configured === "0" || configured.toLowerCase() === "off") {
    return "off";
  }
  return configured;
}

export function buildConnectionKindLabelMap(t: AppTranslations): Record<ConnectionKind, string> {
  return {
    file_log: t.simpleMode.connections.fileLog,
    gcp_cloud_run: t.simpleMode.connections.gcpCloudRun,
  };
}

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
