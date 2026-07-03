import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportRepositorySourceFields } from "../../src/features/library/components/ImportRepositorySourceFields";

function createProps(
  overrides: Partial<React.ComponentProps<typeof ImportRepositorySourceFields>> = {},
) {
  return {
    isGcpCloudRun: false,
    sourceKind: "directory" as const,
    sourcePath: "/workspace",
    label: "Session",
    gcpProjectId: "project",
    gcpServiceName: "service",
    gcpRegion: "us-central1",
    sourcePathFieldCopy: {
      label: "Local project path",
      placeholder: "/workspace",
    },
    busy: false,
    pickerBusy: false,
    pickerBusyLabel: "Loading…",
    gcpProjectIdLabel: "Project ID",
    gcpProjectIdPlaceholder: "project-id",
    cloudRunServiceLabel: "Cloud Run service",
    cloudRunServicePlaceholder: "service-name",
    regionOptionalLabel: "Region",
    regionPlaceholder: "us-central1",
    targetSessionLabelOptional: "Target session label",
    targetSessionLabelPlaceholder: "Optional label",
    onSourcePathChange: vi.fn(),
    onLabelChange: vi.fn(),
    onGcpProjectIdChange: vi.fn(),
    onGcpServiceNameChange: vi.fn(),
    onGcpRegionChange: vi.fn(),
    onBrowseDirectory: vi.fn(),
    onBrowseFile: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ImportRepositorySourceFields", () => {
  it("renders source-path fields and browse action for local/file flows", () => {
    const props = createProps();
    const { unmount } = render(<ImportRepositorySourceFields {...props} />);

    fireEvent.change(screen.getByPlaceholderText("/workspace"), {
      target: { value: "/workspace/next" },
    });
    expect(props.onSourcePathChange).toHaveBeenCalledWith("/workspace/next");

    fireEvent.click(screen.getByRole("button"));
    expect(props.onBrowseDirectory).toHaveBeenCalled();
    unmount();

    const fileProps = createProps({
      sourceKind: "file",
      sourcePathFieldCopy: {
        label: "Source log path",
        placeholder: "/logs/app.log",
      },
    });
    const fileView = render(<ImportRepositorySourceFields {...fileProps} />);

    fireEvent.click(fileView.getByRole("button"));
    expect(fileProps.onBrowseFile).toHaveBeenCalled();
    fileView.unmount();
  });

  it("renders Cloud Run fields and label input for cloud flows", () => {
    const props = createProps({ isGcpCloudRun: true });
    const view = render(<ImportRepositorySourceFields {...props} />);

    fireEvent.change(screen.getByPlaceholderText("project-id"), {
      target: { value: "next-project" },
    });
    fireEvent.change(screen.getByPlaceholderText("service-name"), {
      target: { value: "next-service" },
    });
    fireEvent.change(screen.getByPlaceholderText("us-central1"), {
      target: { value: "europe-west1" },
    });
    fireEvent.change(view.getByDisplayValue("Session"), {
      target: { value: "Prod" },
    });

    expect(props.onGcpProjectIdChange).toHaveBeenCalledWith("next-project");
    expect(props.onGcpServiceNameChange).toHaveBeenCalledWith("next-service");
    expect(props.onGcpRegionChange).toHaveBeenCalledWith("europe-west1");
    expect(props.onLabelChange).toHaveBeenCalledWith("Prod");
  });
});
