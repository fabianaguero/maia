import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodeProjectSonarQubeConfigForm } from "../../../src/features/library/components/CodeProjectSonarQubeConfigForm";
import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import type { CodeProjectFormDraft } from "../../../src/types/codeProject";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

const baseDraft: CodeProjectFormDraft = {
  label: "Checkout service",
  repositoryUrl: "/repos/checkout",
  analysisMode: "local",
  sonarqubeApiUrl: "",
  sonarqubeProjectKey: "",
  sonarqubeAuthToken: "",
  sonarqubePollingInterval: "30",
  sonarqubeSyncRules: false,
  localRulesProfile: "maia-default",
};

function renderForm(overrides: Partial<CodeProjectFormDraft> = {}) {
  const props = {
    draft: { ...baseDraft, ...overrides },
    onDraftChange: vi.fn(),
    onTestConnection: vi.fn(async () => ({ valid: true, issueCount: 7 })),
    onSubmit: vi.fn(async () => undefined),
    onCancel: vi.fn(),
    saving: false,
  };

  renderWithI18n(<CodeProjectSonarQubeConfigForm {...props} />);

  return props;
}

describe("CodeProjectSonarQubeConfigForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("allows saving a local scanner configuration without testing a server", () => {
    const props = renderForm();

    expect(screen.getByRole("button", { name: en.simpleMode.common.save })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: en.simpleMode.codeProjects.testConnection }),
    ).toBeDisabled();
    expect(screen.getByLabelText(en.simpleMode.codeProjects.sonarqubeServerUrl)).toBeDisabled();
    expect(screen.getByLabelText(en.simpleMode.codeProjects.sonarqubeProjectKey)).toBeDisabled();
    expect(screen.getByLabelText(en.simpleMode.codeProjects.sonarqubeAuthToken)).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.common.save }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onTestConnection).not.toHaveBeenCalled();
  });

  it("switches connected mode on with server rule sync enabled", () => {
    const props = renderForm();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.connectedMode }));

    expect(props.onDraftChange).toHaveBeenCalledWith({
      analysisMode: "connected",
      sonarqubeSyncRules: true,
    });
  });

  it("requires a valid connection test before saving a connected configuration", async () => {
    const props = renderForm({
      analysisMode: "connected",
      sonarqubeApiUrl: "https://sonar.example.com",
      sonarqubeProjectKey: "org.example:checkout",
      sonarqubeAuthToken: "squ_test",
      sonarqubeSyncRules: true,
    });

    expect(screen.getByRole("button", { name: en.simpleMode.common.save })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: en.simpleMode.codeProjects.testConnection }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: en.simpleMode.codeProjects.testConnection }),
    );

    await waitFor(() => {
      expect(props.onTestConnection).toHaveBeenCalledWith(
        "https://sonar.example.com",
        "org.example:checkout",
        "squ_test",
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Connection valid/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.common.save }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
});
