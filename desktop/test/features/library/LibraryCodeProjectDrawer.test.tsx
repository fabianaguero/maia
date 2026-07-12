import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LibraryCodeProjectDrawer } from "../../../src/features/library/components/LibraryCodeProjectDrawer";
import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import type { CodeProject } from "../../../src/types/codeProject";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

function createProject(overrides: Partial<CodeProject> = {}): CodeProject {
  return {
    id: "code-project-1",
    label: "Checkout service",
    repositoryUrl: "/home/user/repos/checkout",
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
    enabled: true,
    status: "ready",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("LibraryCodeProjectDrawer", () => {
  afterEach(() => {
    cleanup();
  });

  it("creates a local project and saves local scanner configuration without a server test", async () => {
    const createdProject = createProject();
    const onCreate = vi.fn(async () => createdProject);
    const onUpdate = vi.fn(async () => createdProject);
    const onClose = vi.fn();
    const onTestConnection = vi.fn(async () => ({ valid: true, issueCount: 0 }));

    renderWithI18n(
      <LibraryCodeProjectDrawer
        visible
        onClose={onClose}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onTestConnection={onTestConnection}
      />,
    );

    fireEvent.change(screen.getByLabelText(en.simpleMode.codeProjects.projectName), {
      target: { value: "Checkout service" },
    });
    fireEvent.change(screen.getByLabelText(en.simpleMode.codeProjects.repositoryUrl), {
      target: { value: "/home/user/repos/checkout" },
    });
    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.create }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("Checkout service", "/home/user/repos/checkout");
    });

    expect(screen.getByText(en.simpleMode.codeProjects.configureSonarQube)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.simpleMode.codeProjects.testConnection }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.common.save }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        "code-project-1",
        expect.objectContaining({
          label: "Checkout service",
          repositoryUrl: "/home/user/repos/checkout",
          sonarqubeConfig: expect.objectContaining({
            analysisMode: "local",
            apiUrl: "",
            projectKey: "",
            authToken: "",
            syncRules: false,
            localRulesProfile: "maia-default",
          }),
        }),
      );
    });
    expect(onTestConnection).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses the translated close label", () => {
    renderWithI18n(
      <LibraryCodeProjectDrawer
        visible
        onClose={vi.fn()}
        onCreate={vi.fn(async () => createProject())}
        onUpdate={vi.fn(async () => createProject())}
        onTestConnection={vi.fn(async () => ({ valid: true }))}
      />,
    );

    expect(screen.getByRole("button", { name: en.simpleMode.common.close })).toBeInTheDocument();
  });

  it("clears connected credentials when an existing project is saved as local", async () => {
    const connectedProject = createProject({
      analysisMode: "connected",
      sonarqubeConfig: {
        analysisMode: "connected",
        apiUrl: "https://sonar.example.com",
        projectKey: "org.example:checkout",
        authToken: "squ_secret",
        pollingInterval: "45",
        syncRules: true,
        localRulesProfile: "sonar-way-compatible",
      },
    });
    const onUpdate = vi.fn(async () => connectedProject);

    renderWithI18n(
      <LibraryCodeProjectDrawer
        visible
        project={connectedProject}
        onClose={vi.fn()}
        onCreate={vi.fn(async () => connectedProject)}
        onUpdate={onUpdate}
        onTestConnection={vi.fn(async () => ({ valid: true }))}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.localMode }));
    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.common.save }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        "code-project-1",
        expect.objectContaining({
          sonarqubeConfig: expect.objectContaining({
            analysisMode: "local",
            apiUrl: "",
            projectKey: "",
            authToken: "",
            syncRules: false,
            localRulesProfile: "sonar-way-compatible",
          }),
        }),
      );
    });
  });
});
