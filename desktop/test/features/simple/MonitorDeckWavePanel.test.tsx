import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonitorDeckWavePanel } from "../../../src/features/simple/MonitorDeckWavePanel";

vi.mock("../../../src/i18n/I18nContext", () => ({
  useT: () => ({
    simpleMode: {
      monitor: {
        fullTrackMap: "Full track map",
        overviewHeatMap: "Overview heat map",
        trackLaneCompact: "Track",
        upperLane: "Upper lane",
        logLaneCompact: "Log",
        lowerLane: "Lower lane",
      },
    },
  }),
}));

describe("MonitorDeckWavePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders overview labels, anomaly markers and stage guides", () => {
    const onOverviewPointerDown = vi.fn();
    const onOverviewClick = vi.fn();
    const onOverviewAnomalyClick = vi.fn();
    const onOverviewAnomalyPointerDown = vi.fn();
    const onStagePointerDown = vi.fn();
    const onStageClick = vi.fn();

    const { container } = render(
      <MonitorDeckWavePanel
        overviewCanvasRef={{ current: null }}
        waveformCanvasRef={{ current: null }}
        waveformStageRef={{ current: null }}
        anomalyBurstRegions={[
          { id: "burst-1", startProgress: 0.1, endProgress: 0.2, severity: 0.95, count: 3 },
        ]}
        selectedBurstRegionId="burst-1"
        overviewAnomalyMarkers={[
          {
            id: "anomaly-1",
            progress: 0.25,
            severity: 0.92,
            timestamp: "10:22:31",
            message: "Burst detected",
            leftPercent: 25,
          },
        ]}
        selectedAnomalyId="anomaly-1"
        overviewWindowLeftPercent={20}
        overviewWindowWidthPercent={40}
        overviewPlayheadLeftPercent={35}
        onOverviewPointerDown={onOverviewPointerDown}
        onOverviewClick={onOverviewClick}
        onOverviewAnomalyClick={onOverviewAnomalyClick}
        onOverviewAnomalyPointerDown={onOverviewAnomalyPointerDown}
        deckTimelineMarkers={[
          { id: "tick-1", leftPercent: 12, label: "0:12", emphasis: "major" },
          { id: "playhead", leftPercent: 35, label: "0:35", emphasis: "playhead" },
        ]}
        deckBeatMarkers={[
          { id: "beat-1", leftPercent: 10, major: true },
          { id: "beat-2", leftPercent: 15, major: false },
        ]}
        onStagePointerDown={onStagePointerDown}
        onStageClick={onStageClick}
        stageHeightPx={188}
      />,
    );

    expect(screen.getByText("Full track map")).toBeInTheDocument();
    expect(screen.getByText("Overview heat map")).toBeInTheDocument();
    expect(screen.getByTitle("Upper lane")).toHaveTextContent("Track");
    expect(screen.getByTitle("Lower lane")).toHaveTextContent("Log");

    const anomalyButton = container.querySelector(".monitor-overview-wave__anomaly");
    const overviewWave = screen.getByText("Full track map").closest(".monitor-overview-wave");
    const deckStage = container.querySelector(".monitor-deck-stage");

    fireEvent.pointerDown(anomalyButton!);
    fireEvent.click(anomalyButton!);
    fireEvent.pointerDown(overviewWave!);
    fireEvent.click(overviewWave!);
    fireEvent.pointerDown(deckStage!);
    fireEvent.click(deckStage!);

    expect(onOverviewAnomalyPointerDown).toHaveBeenCalledTimes(1);
    expect(onOverviewAnomalyClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "anomaly-1" }),
      expect.any(Object),
    );
    expect(onOverviewPointerDown).toHaveBeenCalled();
    expect(onOverviewClick).toHaveBeenCalled();
    expect(onStagePointerDown).toHaveBeenCalledTimes(1);
    expect(onStageClick).toHaveBeenCalledTimes(1);
  });
});
