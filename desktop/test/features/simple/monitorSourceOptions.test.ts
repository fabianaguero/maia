import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildMonitorSourceSelectionModel,
  shouldResetSelectedSource,
} from "../../../src/features/simple/monitorSourceOptions";
import type { RepositoryAnalysis } from "../../../src/types/library";
import type { LogSourceConnection } from "../../../src/types/monitor";

describe("monitorSourceOptions", () => {
  const repositories = [
    {
      id: "repo-file",
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      sourceKind: "file",
    },
    {
      id: "repo-folder",
      title: "spring-logs",
      sourcePath: "/logs/maia_spring_logs",
      sourceKind: "directory",
    },
  ] as unknown as RepositoryAnalysis[];

  const connections = [
    {
      id: "conn-cloud-enabled",
      kind: "gcp_cloud_run",
      label: "services",
      sourceUri: "gcp-cloud-run://project/services",
      enabled: true,
      adapterKind: "process",
      config: {},
      lastCursor: 0,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "conn-cloud-disabled",
      kind: "gcp_cloud_run",
      label: "disabled-services",
      sourceUri: "gcp-cloud-run://project/disabled",
      enabled: false,
      adapterKind: "process",
      config: {},
      lastCursor: 0,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ] as LogSourceConnection[];

  const copy = {
    logFile: en.simpleMode.setup.logFile,
    folder: en.simpleMode.setup.folder,
    cloudRemote: en.simpleMode.setup.cloudRemote,
    cloudConnection: en.simpleMode.setup.cloudConnection,
    emptyCloudReady: en.simpleMode.setup.emptyCloudReady,
    emptyCloudMissing: en.simpleMode.setup.emptyCloudMissing,
    emptyFolder: en.simpleMode.setup.emptyFolder,
    emptyDefault: en.simpleMode.setup.emptyDefault,
    startHintDisabledConnection: en.simpleMode.setup.startHintDisabledConnection,
    startHintCloudManaged: en.simpleMode.setup.startHintCloudManaged,
    startHintFileOnly: en.simpleMode.setup.startHintFileOnly,
    startHintReady: en.simpleMode.setup.startHintReady,
    startHintSelect: en.simpleMode.setup.startHintSelect,
  };

  it("builds mixed source options for repositories and cloud connections", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories,
      persistentConnections: connections,
      selectedSourceId: "",
      selectedSoundId: "",
      sourceFilter: "all",
      copy,
    });

    expect(model.allMonitorSourceOptions).toHaveLength(4);
    expect(model.filteredMonitorSourceOptions).toHaveLength(4);
  });

  it("filters cloud sources and exposes cloud-specific empty state copy", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories,
      persistentConnections: [],
      selectedSourceId: "",
      selectedSoundId: "",
      sourceFilter: "cloud",
      copy,
    });

    expect(model.filteredMonitorSourceOptions).toEqual([]);
    expect(model.sourceEmptyMessage).toContain("Configure GCP adapters");
  });

  it("marks disabled cloud connections as not startable with the correct hint", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories,
      persistentConnections: connections,
      selectedSourceId: "connection:conn-cloud-disabled",
      selectedSoundId: "track-1",
      sourceFilter: "cloud",
      copy,
    });

    expect(model.selectedSourceOption?.startable).toBe(false);
    expect(model.canStartSelectedSource).toBe(false);
    expect(model.startHint).toContain("disabled");
  });

  it("returns ready hint when file source and sound are both selected", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories,
      persistentConnections: connections,
      selectedSourceId: "repo-file",
      selectedSoundId: "track-1",
      sourceFilter: "file",
      copy,
    });

    expect(model.canStartSelectedSource).toBe(true);
    expect(model.startHint).toContain("Ready to start passive monitoring");
  });

  it("resets selection only when filter excludes the selected source", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories,
      persistentConnections: connections,
      selectedSourceId: "repo-file",
      selectedSoundId: "",
      sourceFilter: "all",
      copy,
    });

    expect(shouldResetSelectedSource("repo-file", model.selectedSourceOption, "all")).toBe(false);
    expect(shouldResetSelectedSource("repo-file", model.selectedSourceOption, "cloud")).toBe(true);
  });
});
