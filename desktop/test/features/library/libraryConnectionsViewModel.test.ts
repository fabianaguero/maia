import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildLibraryConnectionsViewModel } from "../../../src/features/library/libraryConnectionsViewModel";
import type { LogSourceConnection } from "../../../src/types/library";

function createConnection(input: {
  id: string;
  kind: "file_log" | "gcp_cloud_run";
  enabled: boolean;
  adapterKind: "file" | "process";
}): LogSourceConnection {
  return {
    id: input.id,
    kind: input.kind,
    label: input.id,
    sourceUri: `/source/${input.id}`,
    enabled: input.enabled,
    adapterKind: input.adapterKind,
    config: {},
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T11:00:00.000Z",
  };
}

describe("libraryConnectionsViewModel", () => {
  it("builds file connection cards", () => {
    const model = buildLibraryConnectionsViewModel({
      connections: [createConnection({ id: "tail-a", kind: "file_log", enabled: true, adapterKind: "file" })],
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "tail-a",
      title: "tail-a",
      meta: "File tail · Enabled · file",
      sourceUri: "/source/tail-a",
      isEnabled: true,
    });
  });

  it("builds cloud connection cards", () => {
    const model = buildLibraryConnectionsViewModel({
      connections: [
        createConnection({
          id: "run-a",
          kind: "gcp_cloud_run",
          enabled: false,
          adapterKind: "process",
        }),
      ],
      t: en,
    });

    expect(model[0]).toMatchObject({
      id: "run-a",
      title: "run-a",
      meta: `${en.simpleMode.connections.gcpCloudRun} · ${en.library.disabled} · process`,
      isEnabled: false,
    });
  });
});
