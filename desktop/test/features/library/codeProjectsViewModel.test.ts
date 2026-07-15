import { describe, expect, it } from "vitest";

import {
  createCodeProjectDraftFromProject,
  createEmptyCodeProjectDraft,
  createUpsertCodeProjectInputFromDraft,
  resolveCodeProjectStatusClass,
  resolveCodeProjectStatusLabel,
} from "../../../src/features/library/codeProjectsViewModel";
import { en } from "../../../src/i18n/en";
import type { CodeProject } from "../../../src/types/codeProject";

function createProject(overrides: Partial<CodeProject> = {}): CodeProject {
  return {
    id: "project-1",
    label: "Checkout service",
    repositoryUrl: "/repo/checkout",
    analysisMode: "connected",
    sonarqubeConfig: {
      analysisMode: "connected",
      apiUrl: "https://sonar.example.com",
      projectKey: "org.example:checkout",
      authToken: "squ_test",
      pollingInterval: "45",
      syncRules: true,
      localRulesProfile: "sonar-way-compatible",
    },
    enabled: true,
    status: "ready",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("codeProjectsViewModel", () => {
  it("creates local-first drafts by default", () => {
    expect(createEmptyCodeProjectDraft()).toEqual({
      label: "",
      repositoryUrl: "",
      analysisMode: "local",
      sonarqubeApiUrl: "",
      sonarqubeProjectKey: "",
      sonarqubeAuthToken: "",
      sonarqubePollingInterval: "30",
      sonarqubeSyncRules: false,
      localRulesProfile: "maia-default",
    });
  });

  it("hydrates connected SonarQube project configuration into an editable draft", () => {
    expect(createCodeProjectDraftFromProject(createProject())).toEqual({
      id: "project-1",
      label: "Checkout service",
      repositoryUrl: "/repo/checkout",
      analysisMode: "connected",
      sonarqubeApiUrl: "https://sonar.example.com",
      sonarqubeProjectKey: "org.example:checkout",
      sonarqubeAuthToken: "squ_test",
      sonarqubePollingInterval: "45",
      sonarqubeSyncRules: true,
      localRulesProfile: "sonar-way-compatible",
    });
  });

  it("falls back to local rule defaults when a project has no SonarQube config", () => {
    const draft = createCodeProjectDraftFromProject(
      createProject({
        analysisMode: "local",
        sonarqubeConfig: undefined,
      }),
    );

    expect(draft.analysisMode).toBe("local");
    expect(draft.sonarqubeSyncRules).toBe(false);
    expect(draft.localRulesProfile).toBe("maia-default");
  });

  it("strips remote SonarQube credentials when saving a local project", () => {
    const input = createUpsertCodeProjectInputFromDraft({
      ...createEmptyCodeProjectDraft(),
      label: "Checkout service",
      repositoryUrl: "/repo/checkout",
      analysisMode: "local",
      sonarqubeApiUrl: "https://sonar.example.com",
      sonarqubeProjectKey: "org.example:checkout",
      sonarqubeAuthToken: "squ_secret",
      sonarqubeSyncRules: true,
      localRulesProfile: "sonar-way-compatible",
    });

    expect(input.sonarqubeConfig).toEqual({
      analysisMode: "local",
      apiUrl: "",
      projectKey: "",
      authToken: "",
      pollingInterval: "30",
      syncRules: false,
      localRulesProfile: "sonar-way-compatible",
    });
  });

  it("preserves remote SonarQube config when saving a connected project", () => {
    const input = createUpsertCodeProjectInputFromDraft(
      createCodeProjectDraftFromProject(createProject()),
    );

    expect(input.sonarqubeConfig).toEqual({
      analysisMode: "connected",
      apiUrl: "https://sonar.example.com",
      projectKey: "org.example:checkout",
      authToken: "squ_test",
      pollingInterval: "45",
      syncRules: true,
      localRulesProfile: "sonar-way-compatible",
    });
  });

  it("trims persisted draft fields before saving", () => {
    const input = createUpsertCodeProjectInputFromDraft({
      ...createEmptyCodeProjectDraft(),
      label: "  Checkout service  ",
      repositoryUrl: "  https://github.com/acme/checkout  ",
      analysisMode: "connected",
      sonarqubeApiUrl: "  https://sonar.example.com  ",
      sonarqubeProjectKey: "  org.example:checkout  ",
      sonarqubeAuthToken: "  squ_test  ",
      sonarqubePollingInterval: "  45  ",
      sonarqubeSyncRules: true,
      localRulesProfile: "  sonar-way-compatible  ",
    });

    expect(input).toEqual({
      label: "Checkout service",
      repositoryUrl: "https://github.com/acme/checkout",
      sonarqubeConfig: {
        analysisMode: "connected",
        apiUrl: "https://sonar.example.com",
        projectKey: "org.example:checkout",
        authToken: "squ_test",
        pollingInterval: "45",
        syncRules: true,
        localRulesProfile: "sonar-way-compatible",
      },
    });
  });

  it("resolves status labels and classes through the shared translation contract", () => {
    expect(resolveCodeProjectStatusLabel("ready", en)).toBe("Ready");
    expect(resolveCodeProjectStatusLabel("testing", en)).toBe("Testing");
    expect(resolveCodeProjectStatusLabel("error", en)).toBe("Error");
    expect(resolveCodeProjectStatusLabel("not-configured", en)).toBe("Not configured");

    expect(resolveCodeProjectStatusClass("ready")).toBe("status-badge--ready");
    expect(resolveCodeProjectStatusClass("testing")).toBe("status-badge--testing");
    expect(resolveCodeProjectStatusClass("error")).toBe("status-badge--error");
    expect(resolveCodeProjectStatusClass("not-configured")).toBe("status-badge--not-configured");
  });
});
