import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorPanel } from "../../src/features/analyzer/components/LiveLogMonitorPanel";

const useLiveLogMonitorPanelController = vi.fn();

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPanelController", () => ({
  useLiveLogMonitorPanelController: (...args: unknown[]) =>
    useLiveLogMonitorPanelController(...args),
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorHeader", () => ({
  LiveLogMonitorHeader: ({ title }: { title: string }) => (
    <div data-testid="monitor-header">{title}</div>
  ),
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorSetupSection", () => ({
  LiveLogMonitorSetupSection: ({ visible }: { visible: boolean }) => (
    <div data-testid="monitor-setup">{visible ? "visible" : "hidden"}</div>
  ),
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorLiveDeck", () => ({
  LiveLogMonitorLiveDeck: () => <div data-testid="monitor-live-deck">deck</div>,
}));

function createControllerState(
  overrides: Partial<ReturnType<typeof useLiveLogMonitorPanelController>> = {},
) {
  return {
    liveEnabled: true,
    expanded: true,
    setExpanded: vi.fn(),
    ctaMetaLabel: "BPM 126",
    headerProps: {
      title: "Hybrid monitor",
    },
    setupProps: {
      visible: false,
      t: {
        inspect: {
          liveMonitorDeckCta: "Listen to the stream.",
          liveMonitorDeckOpen: "Open deck",
        },
      },
    },
    liveDeckProps: {},
    ...overrides,
  };
}

describe("LiveLogMonitorPanel", () => {
  it("renders the live deck layout from the controller", () => {
    useLiveLogMonitorPanelController.mockReturnValue(createControllerState());

    render(
      <LiveLogMonitorPanel
        repository={{ id: "repo-1" } as never}
        availableBaseAssets={[]}
        availableCompositions={[]}
        availableTracks={[]}
        availablePlaylists={[]}
      />,
    );

    expect(screen.getByTestId("monitor-header")).toHaveTextContent("Hybrid monitor");
    expect(screen.getByTestId("monitor-setup")).toHaveTextContent("hidden");
    expect(screen.getByTestId("monitor-live-deck")).toBeInTheDocument();
  });

  it("renders the collapsed CTA when the deck is closed and inactive", () => {
    const setExpanded = vi.fn();
    useLiveLogMonitorPanelController.mockReturnValue(
      createControllerState({
        liveEnabled: false,
        expanded: false,
        setExpanded,
        ctaMetaLabel: "Ambient bed armed",
      }),
    );

    render(
      <LiveLogMonitorPanel
        repository={{ id: "repo-1" } as never}
        availableBaseAssets={[]}
        availableCompositions={[]}
        availableTracks={[]}
        availablePlaylists={[]}
      />,
    );

    expect(screen.getByText("Listen to the stream.")).toBeInTheDocument();
    expect(screen.getByText("Ambient bed armed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open deck" }));
    expect(setExpanded).toHaveBeenCalledWith(true);
  });
});
