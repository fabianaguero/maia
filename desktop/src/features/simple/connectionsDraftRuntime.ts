import type { LogSourceConnection, LogSourceConnectionKind } from "../../types/monitor";

export type ConnectionKind = LogSourceConnectionKind;

export interface ConnectionDraft {
  kind: ConnectionKind;
  label: string;
  // File adapter
  sourcePath: string;
  // GCP Cloud Run
  gcpProjectId: string;
  gcpServiceName: string;
  gcpRegion: string;
  gcpBackfillFreshness: string;
}

export function createEmptyConnectionDraft(defaultCloudLookback = "10m"): ConnectionDraft {
  return {
    kind: "file_log",
    label: "",
    sourcePath: "",
    gcpProjectId: "",
    gcpServiceName: "",
    gcpRegion: "",
    gcpBackfillFreshness: defaultCloudLookback,
  };
}

export function readConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function deriveFileConnectionLabel(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return "log-file";
  }
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
  if (connection.kind !== "gcp_cloud_run") {
    return null;
  }
  const configured = readConfigString(connection.config, "backfillFreshness");
  if (!configured) {
    return "10m";
  }
  if (configured === "0" || configured.toLowerCase() === "off") {
    return "off";
  }
  return configured;
}
