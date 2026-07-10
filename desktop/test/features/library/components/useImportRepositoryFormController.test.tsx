import type { FormEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const pickRepositoryDirectory = vi.fn();
const pickRepositoryFile = vi.fn();
const upsertLogSourceConnection = vi.fn();

vi.mock("../../../../src/api/repositories", () => ({
  pickRepositoryDirectory: (...args: unknown[]) => pickRepositoryDirectory(...args),
  pickRepositoryFile: (...args: unknown[]) => pickRepositoryFile(...args),
  upsertLogSourceConnection: (...args: unknown[]) => upsertLogSourceConnection(...args),
}));

import { useImportRepositoryFormController } from "../../../../src/features/library/components/useImportRepositoryFormController";

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>;
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

describe("useImportRepositoryFormController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles file browse plus repository import reset flows", async () => {
    pickRepositoryFile.mockResolvedValue("/logs/app.log");
    const onImportRepository = vi.fn(async () => true);
    const onLogConnectionSaved = vi.fn();
    const { result } = renderHook(() =>
      useImportRepositoryFormController({
        defaultDirectoryPath: "/workspace",
        onImportRepository,
        onLogConnectionSaved,
        copy: createCopy(),
      }),
    );

    await act(async () => {
      result.current.setSourceKind("file");
      await result.current.handleBrowseFile();
    });

    expect(pickRepositoryFile).toHaveBeenCalledWith("");
    expect(result.current.sourcePath).toBe("/logs/app.log");

    act(() => {
      result.current.setLabel("API stream");
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(onImportRepository).toHaveBeenCalledWith({
      sourceKind: "file",
      sourcePath: "/logs/app.log",
      label: "API stream",
    });
    expect(onLogConnectionSaved).toHaveBeenCalledTimes(1);
    expect(result.current.sourcePath).toBe("");
  });

  it("validates and saves Cloud Run connections through the dedicated branch", async () => {
    const onImportRepository = vi.fn(async () => true);
    const { result } = renderHook(() =>
      useImportRepositoryFormController({
        onImportRepository,
        copy: createCopy(),
      }),
    );

    act(() => {
      result.current.selectGcpCloudRun();
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Project and service are required.");

    act(() => {
      result.current.setGcpProjectId("demo-gcp-project");
      result.current.setGcpServiceName("services");
      result.current.setGcpRegion("us-central1");
      result.current.setLabel("Prod Cloud Run");
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(upsertLogSourceConnection).toHaveBeenCalledWith({
      kind: "gcp_cloud_run",
      label: "Prod Cloud Run",
      config: {
        projectId: "demo-gcp-project",
        serviceName: "services",
        region: "us-central1",
        minimumSeverity: "DEFAULT",
      },
    });
    expect(onImportRepository).not.toHaveBeenCalled();
    expect(result.current.gcpProjectId).toBe("");
    expect(result.current.gcpServiceName).toBe("");
    expect(result.current.gcpRegion).toBe("");
  });
});
