import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionsFormPanel } from "../../src/features/simple/ConnectionsFormPanel";
import { createEmptyConnectionDraft } from "../../src/features/simple/connectionsViewModel";

afterEach(() => {
  cleanup();
});

describe("ConnectionsFormPanel", () => {
  it("renders file-log mode and forwards field/button actions", () => {
    const onKindChange = vi.fn();
    const onDraftChange = vi.fn();
    const onBrowseFile = vi.fn();
    const onSaveConnection = vi.fn();
    const onCancelEdit = vi.fn();
    const draft = {
      ...createEmptyConnectionDraft(),
      kind: "file_log" as const,
      sourcePath: "/var/log/app.log",
      label: "app.log",
    };

    const { container } = render(
      <ConnectionsFormPanel
        editingConnectionId="conn-1"
        draft={draft}
        saving={false}
        loading={false}
        pickerBusy={false}
        error={null}
        onKindChange={onKindChange}
        onDraftChange={onDraftChange}
        onBrowseFile={onBrowseFile}
        onSaveConnection={onSaveConnection}
        onCancelEdit={onCancelEdit}
      />,
    );

    fireEvent.click(screen.getByText("GCP Cloud Run"));
    fireEvent.change(screen.getByDisplayValue("/var/log/app.log"), {
      target: { value: "/tmp/next.log" },
    });
    fireEvent.change(screen.getByDisplayValue("app.log"), {
      target: { value: "next.log" },
    });
    const browseButton = container.querySelector(".input-inline-action");
    expect(browseButton).not.toBeNull();
    fireEvent.click(browseButton!);
    fireEvent.click(screen.getByRole("button", { name: /Update connection/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onKindChange).toHaveBeenCalledWith("gcp_cloud_run");
    expect(onDraftChange).toHaveBeenCalledWith({ sourcePath: "/tmp/next.log" });
    expect(onDraftChange).toHaveBeenCalledWith({ label: "next.log" });
    expect(onBrowseFile).toHaveBeenCalled();
    expect(onSaveConnection).toHaveBeenCalled();
    expect(onCancelEdit).toHaveBeenCalled();
  });

  it("renders cloud-run fields and loading/error states", () => {
    const draft = {
      ...createEmptyConnectionDraft(),
      kind: "gcp_cloud_run" as const,
      gcpProjectId: "proj",
      gcpServiceName: "services",
      gcpRegion: "us-central1",
      gcpBackfillFreshness: "120m",
      label: "services",
    };

    render(
      <ConnectionsFormPanel
        editingConnectionId={null}
        draft={draft}
        saving={true}
        loading={false}
        pickerBusy={false}
        error="boom"
        onKindChange={vi.fn()}
        onDraftChange={vi.fn()}
        onBrowseFile={vi.fn()}
        onSaveConnection={vi.fn()}
        onCancelEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("GCP project ID")).toBeInTheDocument();
    expect(screen.getByDisplayValue("proj")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("services")).toHaveLength(2);
    expect(screen.getByDisplayValue("us-central1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("120m")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Analyzing/i })).toBeDisabled();
  });
});
