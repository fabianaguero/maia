import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorSessionCard } from "../../src/features/analyzer/components/LiveLogMonitorSessionCard";

describe("LiveLogMonitorSessionCard", () => {
  it("renders replay session progress and summary", () => {
    render(
      <LiveLogMonitorSessionCard
        replayActive
        replayProgressAria="Replay progress"
        playbackPercent={40}
        repoTitle="visits-service"
        display={{
          title: "Replay session",
          sourceSummary: "Stored source replay · /logs/visits-service.log",
          replayProgressSummary: "40% complete · 12 windows replayed",
        }}
      />,
    );

    expect(screen.getByText("Replay session")).toBeTruthy();
    expect(screen.getByText("visits-service")).toBeTruthy();
    expect(screen.getByText(/Stored source replay/)).toBeTruthy();
    expect(screen.getByText(/40% complete/)).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Replay progress" })).toBeTruthy();
  });

  it("renders live session without replay progress", () => {
    const { container } = render(
      <LiveLogMonitorSessionCard
        replayActive={false}
        replayProgressAria="Replay progress"
        playbackPercent={null}
        repoTitle="visits-service"
        display={{
          title: "Session",
          sourceSummary: "File tail · /logs/visits-service.log",
          replayProgressSummary: null,
        }}
      />,
    );

    expect(screen.getByText("Session")).toBeTruthy();
    expect(container.querySelector(".monitor-progress-track")).toBeNull();
  });
});
