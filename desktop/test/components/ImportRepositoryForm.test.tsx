import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportRepositoryForm } from "../../src/features/library/components/ImportRepositoryForm";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

const pickRepositoryDirectory = vi.fn();
const pickRepositoryFile = vi.fn();
const upsertLogSourceConnection = vi.fn();

vi.mock("../../src/api/repositories", () => ({
  pickRepositoryDirectory: (...args: unknown[]) => pickRepositoryDirectory(...args),
  pickRepositoryFile: (...args: unknown[]) => pickRepositoryFile(...args),
  upsertLogSourceConnection: (...args: unknown[]) => upsertLogSourceConnection(...args),
}));

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ImportRepositoryForm", () => {
  it("validates empty repository paths and supports workspace autofill", async () => {
    const onImportRepository = vi.fn(async () => true);

    renderWithI18n(
      <ImportRepositoryForm
        busy={false}
        defaultDirectoryPath="/workspace/maia"
        onImportRepository={onImportRepository}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: en.library.forms.repository.startIngestion }));
    expect(
      await screen.findByText(en.library.forms.repository.sourceRequiredError),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: en.library.forms.repository.useCurrentWorkspace }),
    );
    fireEvent.click(screen.getByRole("button", { name: en.library.forms.repository.startIngestion }));

    await waitFor(() => {
      expect(onImportRepository).toHaveBeenCalledWith({
        sourceKind: "directory",
        sourcePath: "/workspace/maia",
        label: undefined,
      });
    });
  });

  it("browses file sources and triggers log-connection refresh after import", async () => {
    pickRepositoryFile.mockResolvedValueOnce("/logs/app.log");
    const onImportRepository = vi.fn(async () => true);
    const onLogConnectionSaved = vi.fn();

    renderWithI18n(
      <ImportRepositoryForm
        busy={false}
        onImportRepository={onImportRepository}
        onLogConnectionSaved={onLogConnectionSaved}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.repository.logFile}\\b`),
      }),
    );
    await screen.findByPlaceholderText(en.library.forms.repository.sourceLogPathPlaceholder);
    const browseButtons = screen.getAllByRole("button");
    fireEvent.click(browseButtons.find((button) => button.className.includes("input-inline-action"))!);

    await waitFor(() => {
      expect(pickRepositoryFile).toHaveBeenCalledWith("");
    });

    const pathInput = screen.getByPlaceholderText(
      en.library.forms.repository.sourceLogPathPlaceholder,
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(pathInput.value).toBe("/logs/app.log");
    });

    fireEvent.change(
      screen.getByPlaceholderText(
        en.library.forms.repository.targetSessionLabelPlaceholder,
      ),
      { target: { value: "API stream" } },
    );
    fireEvent.click(screen.getByRole("button", { name: en.library.forms.repository.startIngestion }));

    await waitFor(() => {
      expect(onImportRepository).toHaveBeenCalledWith({
        sourceKind: "file",
        sourcePath: "/logs/app.log",
        label: "API stream",
      });
    });
    expect(onLogConnectionSaved).toHaveBeenCalledTimes(1);
    expect(pathInput.value).toBe("");
  });

  it("saves GCP Cloud Run connections through the dedicated branch", async () => {
    renderWithI18n(
      <ImportRepositoryForm
        busy={false}
        onImportRepository={vi.fn(async () => true)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.repository.gcpCloudRun}\\b`),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: en.library.forms.repository.startIngestion }));

    expect(
      await screen.findByText(en.library.forms.repository.gcpRequiresProjectAndService),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(en.library.forms.repository.gcpProjectIdPlaceholder),
      { target: { value: "innate-portal" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(en.library.forms.repository.cloudRunServicePlaceholder),
      { target: { value: "services" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(en.library.forms.repository.regionPlaceholder),
      { target: { value: "us-central1" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        en.library.forms.repository.targetSessionLabelPlaceholder,
      ),
      { target: { value: "Prod Cloud Run" } },
    );

    fireEvent.click(screen.getByRole("button", { name: en.library.forms.repository.startIngestion }));

    await waitFor(() => {
      expect(upsertLogSourceConnection).toHaveBeenCalledWith({
        kind: "gcp_cloud_run",
        label: "Prod Cloud Run",
        config: {
          projectId: "innate-portal",
          serviceName: "services",
          region: "us-central1",
          minimumSeverity: "DEFAULT",
        },
      });
    });
  });
});
