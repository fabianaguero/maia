import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildConnectionUpsertInput,
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  deriveCloudBackfillLabel,
} from "../../../src/features/simple/connectionsViewModel";
import type { LogSourceConnection } from "../../../src/types/library";

describe("connectionsViewModel", () => {
  it("creates an empty draft with file defaults", () => {
    expect(createEmptyConnectionDraft()).toEqual({
      kind: "file_log",
      label: "",
      sourcePath: "",
      gcpProjectId: "",
      gcpServiceName: "",
      gcpRegion: "",
      gcpBackfillFreshness: "10m",
    });
  });

  it("hydrates a draft from a persisted cloud connection", () => {
    const connection: LogSourceConnection = {
      id: "conn-1",
      kind: "gcp_cloud_run",
      label: "services",
      sourceUri: "gcp-cloud-run://proj/us-central1/services",
      enabled: true,
      adapterKind: "process",
      config: {
        projectId: "proj",
        serviceName: "services",
        region: "us-central1",
        backfillFreshness: "120m",
      },
      lastCursor: 0,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    expect(createConnectionDraftFromConnection(connection)).toMatchObject({
      kind: "gcp_cloud_run",
      label: "services",
      gcpProjectId: "proj",
      gcpServiceName: "services",
      gcpRegion: "us-central1",
      gcpBackfillFreshness: "120m",
    });
  });

  it("builds file-log payloads and validates missing paths", () => {
    const invalid = buildConnectionUpsertInput({
      draft: {
        ...createEmptyConnectionDraft(),
        kind: "file_log",
      },
      editingConnectionId: null,
      t: en,
    });
    expect(invalid.ok).toBe(false);

    const valid = buildConnectionUpsertInput({
      draft: {
        ...createEmptyConnectionDraft(),
        kind: "file_log",
        sourcePath: "/var/log/app.log",
      },
      editingConnectionId: "conn-2",
      t: en,
    });

    expect(valid).toEqual({
      ok: true,
      value: {
        id: "conn-2",
        kind: "file_log",
        label: "app.log",
        sourceUri: "/var/log/app.log",
        config: { path: "/var/log/app.log" },
      },
    });
  });

  it("builds cloud payloads and validates required identifiers", () => {
    const invalid = buildConnectionUpsertInput({
      draft: {
        ...createEmptyConnectionDraft(),
        kind: "gcp_cloud_run",
      },
      editingConnectionId: null,
      t: en,
    });
    expect(invalid.ok).toBe(false);

    const valid = buildConnectionUpsertInput({
      draft: {
        ...createEmptyConnectionDraft(),
        kind: "gcp_cloud_run",
        gcpProjectId: "proj",
        gcpServiceName: "services",
        gcpRegion: "us-central1",
        gcpBackfillFreshness: "",
      },
      editingConnectionId: null,
      t: en,
    });

    expect(valid).toEqual({
      ok: true,
      value: {
        kind: "gcp_cloud_run",
        label: "services · Cloud Run",
        sourceUri: "gcp-cloud-run://proj/us-central1/services",
        config: {
          projectId: "proj",
          serviceName: "services",
          region: "us-central1",
          minimumSeverity: "DEFAULT",
          backfillFreshness: "10m",
        },
      },
    });
  });

  it("derives cloud backfill labels including off mode", () => {
    const connection = {
      id: "conn-3",
      kind: "gcp_cloud_run",
      label: "services",
      sourceUri: "gcp-cloud-run://proj/services",
      enabled: true,
      adapterKind: "process",
      config: { backfillFreshness: "off" },
      lastCursor: 0,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    } as LogSourceConnection;

    expect(deriveCloudBackfillLabel(connection)).toBe("off");
  });
});
