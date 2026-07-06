import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShellStatsFooter } from "../../src/components/AppShellStatsFooter";

describe("AppShellStatsFooter", () => {
  it("renders track, log and profile counters with their titles", () => {
    render(
      <AppShellStatsFooter
        tracksTitle="Tracks"
        tracksShort="TRK"
        trackCount={12}
        logsTitle="Logs"
        logsShort="LOG"
        repositoryCount={5}
        profilesTitle="Profiles"
        profilesShort="FX"
        baseAssetCount={7}
      />,
    );

    expect(screen.getByText("TRK")).toHaveAttribute("title", "Tracks");
    expect(screen.getByText("LOG")).toHaveAttribute("title", "Logs");
    expect(screen.getByText("FX")).toHaveAttribute("title", "Profiles");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
