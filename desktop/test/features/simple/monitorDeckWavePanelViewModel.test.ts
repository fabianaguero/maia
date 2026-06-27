import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildMonitorDeckWavePanelViewModel } from "../../../src/features/simple/monitorDeckWavePanelViewModel";

describe("monitorDeckWavePanelViewModel", () => {
  it("builds overview and lane labels from translations", () => {
    const viewModel = buildMonitorDeckWavePanelViewModel({
      t: en,
    });

    expect(viewModel.overview).toEqual({
      label: en.simpleMode.monitor.fullTrackMap,
      sublabel: en.simpleMode.monitor.overviewHeatMap,
    });
    expect(viewModel.laneLabels).toEqual([
      {
        key: "track",
        label: en.simpleMode.monitor.trackLaneCompact,
        title: en.simpleMode.monitor.upperLane,
        tone: "track",
      },
      {
        key: "log",
        label: en.simpleMode.monitor.logLaneCompact,
        title: en.simpleMode.monitor.lowerLane,
        tone: "log",
      },
    ]);
  });
});
