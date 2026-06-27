import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorSetupDeck } from "../../src/features/analyzer/components/LiveLogMonitorSetupDeck";

vi.mock("../../src/features/analyzer/components/LiveLogMonitorWorkflowStrip", () => ({
  LiveLogMonitorWorkflowStrip: () => <div>workflow-strip</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorBasePlaylistPanel", () => ({
  LiveLogMonitorBasePlaylistPanel: () => <div>base-playlist-panel</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorLaunchPanel", () => ({
  LiveLogMonitorLaunchPanel: () => <div>launch-panel</div>,
}));

describe("LiveLogMonitorSetupDeck", () => {
  it("renders nothing when hidden", () => {
    const { container } = render(
      <LiveLogMonitorSetupDeck
        visible={false}
        workflowStripProps={{} as never}
        basePlaylistPanelProps={{} as never}
        launchPanelProps={{} as never}
      />,
    );

    expect(container.textContent).toBe("");
  });

  it("renders workflow, playlist, and launch sections when visible", () => {
    render(
      <LiveLogMonitorSetupDeck
        visible
        workflowStripProps={{} as never}
        basePlaylistPanelProps={{} as never}
        launchPanelProps={{} as never}
      />,
    );

    expect(screen.getByText("workflow-strip")).toBeTruthy();
    expect(screen.getByText("base-playlist-panel")).toBeTruthy();
    expect(screen.getByText("launch-panel")).toBeTruthy();
  });
});
