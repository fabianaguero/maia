import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildLiveTailPanelViewModel,
  getMonitorLevelBadgeLabel,
} from "../../../src/features/simple/liveTailPanelViewModel";
import type { MonitorLogLine } from "../../../src/features/simple/monitorLogParsing";

const lines: MonitorLogLine[] = [
  {
    id: "line-1",
    timestamp: "10:00:01",
    level: "info",
    message: "Boot completed",
    isAnomaly: false,
    anomalyId: null,
  },
  {
    id: "line-2",
    timestamp: "10:00:02",
    level: "error",
    message: "HTTP 500 on /checkout",
    isAnomaly: true,
    anomalyId: "anom-1",
  },
];

describe("liveTailPanelViewModel", () => {
  it("builds filtered anomaly mode labels and visible line summary", () => {
    const viewModel = buildLiveTailPanelViewModel({
      t: en,
      liveLines: lines,
      isAnomalyFilterActive: true,
      isConsoleExpanded: false,
      isConnectingMonitor: false,
      monitorSourcePath: "/tmp/service.log",
      streamAdapterLabel: "file",
    });

    expect(viewModel.title).toBe(en.simpleMode.monitor.anomalyDetectionStream);
    expect(viewModel.subtitle).toBe("file · /tmp/service.log");
    expect(viewModel.actionHint).toBe(en.simpleMode.common.inspect);
    expect(viewModel.filteredLines).toHaveLength(1);
    expect(viewModel.filteredLines[0]?.id).toBe("line-2");
    expect(viewModel.visibleLinesLabel).toBe("file: 1 visible lines");
    expect(viewModel.showClearFilter).toBe(true);
    expect(viewModel.summaryChips).toEqual([
      { key: "rows", label: en.simpleMode.monitor.rowsShort, value: "1", tone: "neutral" },
      { key: "error", label: en.simpleMode.monitor.errorsShort, value: "1", tone: "error" },
      { key: "warn", label: en.simpleMode.monitor.warningsShort, value: "0", tone: "warn" },
      { key: "info", label: en.simpleMode.monitor.infoShort, value: "0", tone: "info" },
    ]);
  });

  it("builds empty connecting state for unopened streams", () => {
    const viewModel = buildLiveTailPanelViewModel({
      t: en,
      liveLines: [],
      isAnomalyFilterActive: false,
      isConsoleExpanded: true,
      isConnectingMonitor: true,
      monitorSourcePath: "gcp://service",
      streamAdapterLabel: "gcp",
    });

    expect(viewModel.title).toBe(en.simpleMode.monitor.liveSystemIngestion);
    expect(viewModel.subtitle).toBe("gcp · gcp://service");
    expect(viewModel.actionHint).toBe(en.simpleMode.common.close);
    expect(viewModel.statusBadgeLabel).toBe("gcp: connecting");
    expect(viewModel.emptyStateLabel).toBe(en.simpleMode.monitor.connectingRemoteStream);
    expect(viewModel.emptyStateHint).toContain("gcp://service");
    expect(viewModel.visibleLinesLabel).toBeNull();
    expect(viewModel.summaryChips).toEqual([
      { key: "rows", label: en.simpleMode.monitor.rowsShort, value: "0", tone: "neutral" },
      { key: "error", label: en.simpleMode.monitor.errorsShort, value: "0", tone: "error" },
      { key: "warn", label: en.simpleMode.monitor.warningsShort, value: "0", tone: "warn" },
      { key: "info", label: en.simpleMode.monitor.infoShort, value: "0", tone: "info" },
    ]);
  });

  it("builds active empty-state badge for armed streams without lines yet", () => {
    const viewModel = buildLiveTailPanelViewModel({
      t: en,
      liveLines: [],
      isAnomalyFilterActive: false,
      isConsoleExpanded: false,
      isConnectingMonitor: false,
      monitorSourcePath: "/tmp/service.log",
      streamAdapterLabel: "file",
    });

    expect(viewModel.statusBadgeLabel).toBe("file: active (0 lines detected)");
    expect(viewModel.emptyStateLabel).toBe(en.simpleMode.monitor.waitingLiveIngestion);
    expect(viewModel.showClearFilter).toBe(false);
  });

  it("maps level badges through translations", () => {
    expect(getMonitorLevelBadgeLabel("info", en)).toBe(en.simpleMode.monitor.levelInfoShort);
    expect(getMonitorLevelBadgeLabel("warn", en)).toBe(en.simpleMode.monitor.levelWarnShort);
    expect(getMonitorLevelBadgeLabel("error", en)).toBe(en.simpleMode.monitor.levelErrorShort);
    expect(getMonitorLevelBadgeLabel("debug", en)).toBe(en.simpleMode.monitor.levelDebugShort);
    expect(getMonitorLevelBadgeLabel("trace", en)).toBe(en.simpleMode.monitor.levelTraceShort);
  });

  it("shows a dedicated empty state when anomaly filter has no matching rows", () => {
    const viewModel = buildLiveTailPanelViewModel({
      t: en,
      liveLines: [
        {
          id: "line-3",
          timestamp: "10:00:03",
          level: "info",
          message: "Still healthy",
          isAnomaly: false,
          anomalyId: null,
        },
      ],
      isAnomalyFilterActive: true,
      isConsoleExpanded: false,
      isConnectingMonitor: false,
      monitorSourcePath: "/tmp/service.log",
      streamAdapterLabel: "file",
    });

    expect(viewModel.filteredLines).toHaveLength(0);
    expect(viewModel.emptyStateLabel).toBe(en.simpleMode.monitor.noAnomalyLines);
    expect(viewModel.emptyStateHint).toBe(en.simpleMode.monitor.noAnomalyLinesHint);
  });
});
