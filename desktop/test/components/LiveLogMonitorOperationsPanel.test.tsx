import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorOperationsPanel } from "../../src/features/analyzer/components/LiveLogMonitorOperationsPanel";

describe("LiveLogMonitorOperationsPanel", () => {
  it("renders metrics, source info and volume controls", () => {
    const onSetMasterVolume = vi.fn();
    const onToggleMute = vi.fn();

    render(
      <LiveLogMonitorOperationsPanel
        metricGridItems={[
          { label: "Mode", value: "Live" },
          { label: "Beat clock", value: "126 BPM" },
        ]}
        masterVolume={0.4}
        replayActive={false}
        repositorySourcePath="/logs/visits-service.log"
        labels={{
          masterVolume: "Master volume",
          masterVolumeAria: "Master volume slider",
          muteAction: "Mute",
          unmuteAction: "Unmute",
          replaySourcePath: "Replay source path",
          liveSourcePath: "Live source path",
        }}
        onSetMasterVolume={onSetMasterVolume}
        onToggleMute={onToggleMute}
        scenePanel={<div>Scene panel host</div>}
        routingPanel={<div>Routing panel host</div>}
      />,
    );

    expect(screen.getByText("Mode")).toBeTruthy();
    expect(screen.getByText("126 BPM")).toBeTruthy();
    expect(screen.getByText("/logs/visits-service.log")).toBeTruthy();
    expect(screen.getByText("Scene panel host")).toBeTruthy();
    expect(screen.getByText("Routing panel host")).toBeTruthy();

    fireEvent.click(screen.getByText("Mute"));
    fireEvent.click(screen.getAllByRole("button", { name: "40%" })[0]!);

    expect(onToggleMute).toHaveBeenCalledTimes(1);
    expect(onSetMasterVolume).toHaveBeenCalledWith(0.4);
  });
});
