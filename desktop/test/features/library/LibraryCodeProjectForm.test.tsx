import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LibraryCodeProjectForm } from "../../../src/features/library/components/LibraryCodeProjectForm";
import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import type { CodeProjectFormDraft } from "../../../src/types/codeProject";

const pickRepositoryDirectoryMock = vi.fn();

vi.mock("../../../src/api/repositories", () => ({
  pickRepositoryDirectory: (...args: unknown[]) => pickRepositoryDirectoryMock(...args),
}));

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

const baseDraft: CodeProjectFormDraft = {
  label: "Checkout service",
  repositoryUrl: "/home/user/repos/checkout",
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
    onSubmit: vi.fn(async () => undefined),
    onCancel: vi.fn(),
    saving: false,
  };

  renderWithI18n(<LibraryCodeProjectForm {...props} />);

  return props;
}

describe("LibraryCodeProjectForm", () => {
  afterEach(() => {
    pickRepositoryDirectoryMock.mockReset();
    cleanup();
  });

  it("accepts a local repository path for local-first analysis", () => {
    const props = renderForm({ repositoryUrl: "/home/user/repos/checkout" });

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.create }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Invalid repository URL or local path")).not.toBeInTheDocument();
  });

  it("accepts an https repository URL", () => {
    const props = renderForm({ repositoryUrl: "https://github.com/fabianaguero/maia" });

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.create }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported repository locations", () => {
    const props = renderForm({ repositoryUrl: "not a url" });

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.codeProjects.create }));

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Invalid repository URL or local path")).toBeInTheDocument();
  });

  it("fills the repository path from the native directory picker", async () => {
    pickRepositoryDirectoryMock.mockResolvedValue("/home/user/repos/local-checkout");
    const props = renderForm({ repositoryUrl: "" });

    fireEvent.click(
      screen.getByRole("button", { name: en.simpleMode.codeProjects.browseLocalRepository }),
    );

    await waitFor(() => {
      expect(pickRepositoryDirectoryMock).toHaveBeenCalledWith("");
    });
    await waitFor(() => {
      expect(props.onDraftChange).toHaveBeenCalledWith({
        repositoryUrl: "/home/user/repos/local-checkout",
      });
    });
  });
});
