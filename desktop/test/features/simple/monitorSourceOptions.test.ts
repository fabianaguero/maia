import { describe, expect, it } from "vitest";

import type { CodeProject } from "../../../src/types/codeProject";
import {
  buildMonitorSourceSelectionModel,
  type MonitorSourceCopy,
} from "../../../src/features/simple/monitorSourceOptions";

const copy: MonitorSourceCopy = {
  logFile: "Log file",
  folder: "Folder",
  cloudRemote: "Cloud / remote",
  cloudConnection: "Cloud connection",
  codeProject: "Code project",
  emptyCloudReady: "Choose a cloud connection.",
  emptyCloudMissing: "No cloud connections.",
  emptyCodeReady: "Choose a code project.",
  emptyCodeMissing: "No code projects.",
  emptyFolder: "Folders are not monitorable.",
  emptyDefault: "No sources.",
  startHintDisabledConnection: "Connection disabled.",
  startHintCloudManaged: "Cloud managed elsewhere.",
  startHintCodeNotConfigured: "CodeProject not configured.",
  startHintFileOnly: "File only.",
  startHintReady: "Ready.",
  startHintSelect: "Select source and sound.",
};

function codeProject(overrides: Partial<CodeProject> = {}): CodeProject {
  return {
    id: "project-1",
    label: "checkout quality",
    repositoryUrl: "https://github.com/acme/checkout",
    analysisMode: "connected",
    sonarqubeConfig: {
      analysisMode: "connected",
      apiUrl: "https://sonar.local",
      projectKey: "checkout",
      authToken: "squ_test",
      pollingInterval: "30",
      syncRules: true,
      localRulesProfile: "sonar-way-compatible",
    },
    enabled: true,
    status: "ready",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("monitorSourceOptions", () => {
  it("exposes configured CodeProjects as startable monitor sources", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories: [],
      persistentConnections: [],
      codeProjects: [codeProject()],
      selectedSourceId: "code-project:project-1",
      selectedSoundId: "track-1",
      sourceFilter: "code",
      copy,
    });

    expect(model.filteredMonitorSourceOptions).toHaveLength(1);
    expect(model.selectedSourceOption).toMatchObject({
      id: "code-project:project-1",
      sourceType: "code",
      sourceTypeLabel: "Code project",
      origin: "codeProject",
      adapterKind: "sonarqube",
      startable: true,
    });
    expect(model.selectedSourceOption?.connectionConfig).toMatchObject({
      apiUrl: "https://sonar.local",
      projectKey: "checkout",
      authToken: "squ_test",
    });
    expect(model.canStartSelectedSource).toBe(true);
    expect(model.startHint).toBe("Ready.");
  });

  it("keeps incomplete CodeProjects visible but not startable", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories: [],
      persistentConnections: [],
      codeProjects: [
        codeProject({
          id: "project-2",
          sonarqubeConfig: {
            analysisMode: "connected",
            apiUrl: "https://sonar.local",
            projectKey: "",
            authToken: "squ_test",
            pollingInterval: "30",
            syncRules: true,
            localRulesProfile: "sonar-way-compatible",
          },
        }),
      ],
      selectedSourceId: "code-project:project-2",
      selectedSoundId: "track-1",
      sourceFilter: "code",
      copy,
    });

    expect(model.filteredMonitorSourceOptions).toHaveLength(1);
    expect(model.canStartSelectedSource).toBe(false);
    expect(model.startHint).toBe("CodeProject not configured.");
  });

  it("allows local CodeProjects without SonarQube server credentials", () => {
    const model = buildMonitorSourceSelectionModel({
      repositories: [],
      persistentConnections: [],
      codeProjects: [
        codeProject({
          id: "project-local",
          repositoryUrl: "/workspace/checkout",
          analysisMode: "local",
          sonarqubeConfig: {
            analysisMode: "local",
            apiUrl: "",
            projectKey: "",
            authToken: "",
            pollingInterval: "30",
            syncRules: false,
            localRulesProfile: "maia-default",
          },
        }),
      ],
      selectedSourceId: "code-project:project-local",
      selectedSoundId: "track-1",
      sourceFilter: "code",
      copy,
    });

    expect(model.selectedSourceOption?.sourcePath).toBe("/workspace/checkout");
    expect(model.selectedSourceOption?.connectionConfig).toMatchObject({
      analysisMode: "local",
      localRulesProfile: "maia-default",
      repositoryUrl: "/workspace/checkout",
    });
    expect(model.canStartSelectedSource).toBe(true);
  });
});
