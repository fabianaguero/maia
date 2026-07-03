import { describe, expect, it, vi } from "vitest";

import {
  buildImportRepositorySubmission,
  isGcpCloudRunRepositoryDraft,
  normalizeImportRepositoryDraft,
  resetImportRepositoryFormState,
  resolveRepositoryPathFieldCopy,
} from "../../../../src/features/library/components/importRepositoryFormRuntime";

describe("importRepositoryFormRuntime", () => {
  it("normalizes draft fields and detects the GCP Cloud Run branch", () => {
    const draft = normalizeImportRepositoryDraft({
      sourceKind: "url",
      sourcePath: " gcp-cloud-run ",
      label: " Prod ",
      gcpProjectId: " innate-portal ",
      gcpServiceName: " services ",
      gcpRegion: " us-central1 ",
    });

    expect(draft).toEqual({
      sourceKind: "url",
      sourcePath: "gcp-cloud-run",
      label: "Prod",
      gcpProjectId: "innate-portal",
      gcpServiceName: "services",
      gcpRegion: "us-central1",
    });
    expect(isGcpCloudRunRepositoryDraft(draft)).toBe(true);
  });

  it("builds repository and cloud-run submissions with proper validation", () => {
    expect(
      buildImportRepositorySubmission(
        {
          sourceKind: "url",
          sourcePath: "gcp-cloud-run",
          label: "",
          gcpProjectId: "",
          gcpServiceName: "",
          gcpRegion: "",
        },
        {
          gcpRequiresProjectAndService: "project+service required",
          cloudRunLabelSuffix: "Cloud Run",
        },
      ),
    ).toEqual({
      kind: "validation_error",
      error: "project+service required",
    });

    expect(
      buildImportRepositorySubmission(
        {
          sourceKind: "url",
          sourcePath: "gcp-cloud-run",
          label: "",
          gcpProjectId: "innate-portal",
          gcpServiceName: "services",
          gcpRegion: "us-central1",
        },
        {
          gcpRequiresProjectAndService: "project+service required",
          cloudRunLabelSuffix: "Cloud Run",
        },
      ),
    ).toEqual({
      kind: "gcp_connection",
      connection: {
        kind: "gcp_cloud_run",
        label: "services · Cloud Run",
        config: {
          projectId: "innate-portal",
          serviceName: "services",
          region: "us-central1",
          minimumSeverity: "DEFAULT",
        },
      },
    });

    expect(
      buildImportRepositorySubmission(
        {
          sourceKind: "file",
          sourcePath: " /logs/app.log ",
          label: " API stream ",
          gcpProjectId: "",
          gcpServiceName: "",
          gcpRegion: "",
        },
        {
          gcpRequiresProjectAndService: "project+service required",
          cloudRunLabelSuffix: "Cloud Run",
        },
      ),
    ).toEqual({
      kind: "repository_import",
      input: {
        sourceKind: "file",
        sourcePath: "/logs/app.log",
        label: "API stream",
      },
    });
  });

  it("resets the correct subset of fields and resolves path copy by source kind", () => {
    const setters = {
      setLabel: vi.fn(),
      setSourcePath: vi.fn(),
      setGcpProjectId: vi.fn(),
      setGcpServiceName: vi.fn(),
      setGcpRegion: vi.fn(),
    };

    resetImportRepositoryFormState(setters, "repository_import");
    expect(setters.setLabel).toHaveBeenCalledWith("");
    expect(setters.setSourcePath).toHaveBeenCalledWith("");
    expect(setters.setGcpProjectId).not.toHaveBeenCalled();

    resetImportRepositoryFormState(setters, "gcp_connection");
    expect(setters.setGcpProjectId).toHaveBeenCalledWith("");
    expect(setters.setGcpServiceName).toHaveBeenCalledWith("");
    expect(setters.setGcpRegion).toHaveBeenCalledWith("");

    expect(
      resolveRepositoryPathFieldCopy({
        sourceKind: "directory",
        localProjectPath: "Local project path",
        sourceLogPath: "Source log path",
        githubRepositoryUrl: "GitHub repository URL",
        localProjectPathPlaceholder: "/workspace",
        sourceLogPathPlaceholder: "/logs/app.log",
        githubRepositoryUrlPlaceholder: "https://github.com/org/repo",
      }),
    ).toEqual({
      label: "Local project path",
      placeholder: "/workspace",
    });
  });
});
