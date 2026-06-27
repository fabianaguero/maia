import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveLogMonitorLiveDeck } from "../../src/features/analyzer/components/LiveLogMonitorLiveDeck";

afterEach(() => {
  cleanup();
});

vi.mock("../../src/features/analyzer/components/LiveLogMonitorPlaylistSummary", () => ({
  LiveLogMonitorPlaylistSummary: ({ title }: { title: string }) => (
    <div data-testid="playlist-summary">{title}</div>
  ),
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorSessionCard", () => ({
  LiveLogMonitorSessionCard: ({ repoTitle }: { repoTitle: string }) => (
    <div data-testid="session-card">{repoTitle}</div>
  ),
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorReplaySection", () => ({
  LiveLogMonitorReplaySection: () => <div data-testid="replay-section">replay</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorOperationsPanel", () => ({
  LiveLogMonitorOperationsPanel: () => <div data-testid="operations-panel">operations</div>,
}));

describe("LiveLogMonitorLiveDeck", () => {
  it("renders the optional playlist summary and session card only when active", () => {
    render(
      <LiveLogMonitorLiveDeck
        liveEnabled
        hasBasePlaylist
        playlistSummaryProps={{ title: "Base playlist" } as never}
        sessionCardProps={{ repoTitle: "services" } as never}
        replaySectionProps={{} as never}
        operationsPanelProps={{} as never}
        activeDeckContent={<div data-testid="active-deck">deck</div>}
      />,
    );

    expect(screen.getByTestId("playlist-summary")).toHaveTextContent("Base playlist");
    expect(screen.getByTestId("session-card")).toHaveTextContent("services");
    expect(screen.getByTestId("replay-section")).toBeInTheDocument();
    expect(screen.getByTestId("operations-panel")).toBeInTheDocument();
    expect(screen.getByTestId("active-deck")).toBeInTheDocument();
  });

  it("skips optional live-only cards when monitoring is inactive", () => {
    render(
      <LiveLogMonitorLiveDeck
        liveEnabled={false}
        hasBasePlaylist={false}
        playlistSummaryProps={{ title: "Base playlist" } as never}
        sessionCardProps={null}
        replaySectionProps={{} as never}
        operationsPanelProps={{} as never}
        activeDeckContent={<div data-testid="active-deck">deck</div>}
      />,
    );

    expect(screen.queryByTestId("playlist-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("session-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("replay-section")).toBeInTheDocument();
    expect(screen.getByTestId("operations-panel")).toBeInTheDocument();
    expect(screen.getByTestId("active-deck")).toBeInTheDocument();
  });
});
