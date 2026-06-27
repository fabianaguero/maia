import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorPlaylistSummary } from "../../src/features/analyzer/components/LiveLogMonitorPlaylistSummary";

describe("LiveLogMonitorPlaylistSummary", () => {
  it("renders playlist summary and lost badges", () => {
    render(
      <LiveLogMonitorPlaylistSummary
        label="Base playlist"
        title="Night deck"
        nowPlayingLine="Now playing: Track A · 126 BPM"
        upNextLine="Up next: Track B · phrase mix"
        profileDescription="Smooth bed with reactive mutations"
        lostLabel="LOST"
        items={[
          { id: "a", title: "Track A · 126 BPM", lostTitle: null },
          { id: "b", title: "Track B · 124 BPM", lostTitle: "Missing file" },
        ]}
      />,
    );

    expect(screen.getByText("Night deck")).toBeTruthy();
    expect(screen.getByText(/Now playing:/)).toBeTruthy();
    expect(screen.getByText(/Up next:/)).toBeTruthy();
    expect(screen.getByText("Track A · 126 BPM")).toBeTruthy();
    expect(screen.getByText("LOST")).toBeTruthy();
  });
});
