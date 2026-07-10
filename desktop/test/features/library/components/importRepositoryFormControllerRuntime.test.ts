import { describe, expect, it, vi } from "vitest";

import {
  browseImportRepositorySource,
  submitImportRepositoryDraft,
} from "../../../../src/features/library/components/importRepositoryFormControllerRuntime";

function createSetters() {
  return {
    setLabel: vi.fn(),
    setSourcePath: vi.fn(),
    setGcpProjectId: vi.fn(),
    setGcpServiceName: vi.fn(),
    setGcpRegion: vi.fn(),
    setSourceKind: vi.fn(),
    setError: vi.fn(),
    setPickerBusy: vi.fn(),
  };
}

function createCopy() {
  return {
    gcpRequiresProjectAndService: "Project and service are required.",
    cloudRunLabelSuffix: "Cloud Run",
    sourceRequiredError: "Source path is required.",
    directoryPickerFailed: "Directory picker failed.",
    filePickerFailed: "File picker failed.",
  };
}

describe("importRepositoryFormControllerRuntime", () => {
  it("submits file imports and resets the form after a successful import", async () => {
    const setters = createSetters();
    const onImportRepository = vi.fn(async () => true);
    const onLogConnectionSaved = vi.fn();

    await submitImportRepositoryDraft({
      draft: {
        sourceKind: "file",
        sourcePath: "/logs/app.log",
        label: "API stream",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
      },
      copy: createCopy(),
      setters,
      onImportRepository,
      onLogConnectionSaved,
      saveLogSourceConnection: vi.fn(),
    });

    expect(onImportRepository).toHaveBeenCalledWith({
      sourceKind: "file",
      sourcePath: "/logs/app.log",
      label: "API stream",
    });
    expect(onLogConnectionSaved).toHaveBeenCalledTimes(1);
    expect(setters.setLabel).toHaveBeenCalledWith("");
    expect(setters.setSourcePath).toHaveBeenCalledWith("");
  });

  it("validates and persists Cloud Run connections through the dedicated branch", async () => {
    const setters = createSetters();
    const saveLogSourceConnection = vi.fn();

    await submitImportRepositoryDraft({
      draft: {
        sourceKind: "url",
        sourcePath: "gcp-cloud-run",
        label: "Prod Cloud Run",
        gcpProjectId: "demo-gcp-project",
        gcpServiceName: "services",
        gcpRegion: "us-central1",
      },
      copy: createCopy(),
      setters,
      onImportRepository: vi.fn(async () => true),
      saveLogSourceConnection,
    });

    expect(saveLogSourceConnection).toHaveBeenCalledWith({
      kind: "gcp_cloud_run",
      label: "Prod Cloud Run",
      config: {
        projectId: "demo-gcp-project",
        serviceName: "services",
        region: "us-central1",
        minimumSeverity: "DEFAULT",
      },
    });
    expect(setters.setGcpProjectId).toHaveBeenCalledWith("");
    expect(setters.setGcpServiceName).toHaveBeenCalledWith("");
    expect(setters.setGcpRegion).toHaveBeenCalledWith("");
  });

  it("applies browse results and surfaces picker failures", async () => {
    const setters = createSetters();

    await browseImportRepositorySource({
      browseKind: "directory",
      sourcePath: "",
      defaultDirectoryPath: "/workspace",
      copy: createCopy(),
      setters,
      pickDirectory: vi.fn(async () => "/workspace/maia"),
      pickFile: vi.fn(async () => null),
    });

    expect(setters.setSourceKind).toHaveBeenCalledWith("directory");
    expect(setters.setSourcePath).toHaveBeenCalledWith("/workspace/maia");

    const errorSetters = createSetters();
    await browseImportRepositorySource({
      browseKind: "file",
      sourcePath: "/logs/app.log",
      copy: createCopy(),
      setters: errorSetters,
      pickDirectory: vi.fn(async () => null),
      pickFile: vi.fn(async () => {
        throw new Error("picker failed");
      }),
    });

    expect(errorSetters.setError).toHaveBeenCalledWith("picker failed");
    expect(errorSetters.setPickerBusy).toHaveBeenNthCalledWith(1, true);
    expect(errorSetters.setPickerBusy).toHaveBeenLastCalledWith(false);
  });
});
