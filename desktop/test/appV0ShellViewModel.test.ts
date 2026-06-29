import { describe, expect, it } from "vitest";

import type { ActiveMonitorSession, MonitorMetrics } from "../src/features/monitor/MonitorContext";
import { en } from "../src/i18n/en";
import {
  buildAppV0ShellViewModel,
  resolveAppV0SelectedItemLabel,
} from "../src/appV0ShellViewModel";

const metrics: MonitorMetrics = {
  totalLines: 0,
  totalAnomalies: 9,
  avgLinesPerSecond: 0,
  peakLinesPerSecond: 0,
  lastTimestamp: null,
  anomalyBursts: 0,
};

const session = {
  repoTitle: "visits-service",
} as ActiveMonitorSession;

describe("appV0ShellViewModel", () => {
  it("resolves selected focus labels from section context", () => {
    expect(
      resolveAppV0SelectedItemLabel({
        currentSection: "monitor",
        t: en,
        session,
        selectedRepositoryTitle: null,
        selectedTrackTitle: null,
      }),
    ).toBe("visits-service");

    expect(
      resolveAppV0SelectedItemLabel({
        currentSection: "library",
        t: en,
        session: null,
        selectedRepositoryTitle: "repo-a",
        selectedTrackTitle: "track-a",
      }),
    ).toBe("repo-a");

    expect(
      resolveAppV0SelectedItemLabel({
        currentSection: "connections",
        t: en,
        session: null,
      }),
    ).toBe(en.simpleMode.nav.connections);
  });

  it("builds monitoring status and hides the floating bar on the monitor section", () => {
    const viewModel = buildAppV0ShellViewModel({
      currentSection: "monitor",
      isMonitoring: true,
      session,
      metrics,
      uptimeLabel: "15s",
      t: en,
      selectedRepositoryTitle: null,
      selectedTrackTitle: null,
    });

    expect(viewModel.monitoringStatus).toEqual({
      source: "visits-service",
      anomalies: 9,
      uptime: "15s",
      confidence: 87,
    });
    expect(viewModel.selectedItem).toBe("visits-service");
    expect(viewModel.floatingWaveformBar).toEqual({ isVisible: false });
  });

  it("shows the floating bar away from the monitor view while monitoring is active", () => {
    const viewModel = buildAppV0ShellViewModel({
      currentSection: "setup",
      isMonitoring: true,
      session,
      metrics,
      uptimeLabel: "1m 2s",
      t: en,
      selectedRepositoryTitle: null,
      selectedTrackTitle: null,
    });

    expect(viewModel.selectedItem).toBe(en.simpleMode.nav.setup);
    expect(viewModel.floatingWaveformBar).toEqual({
      isVisible: true,
      source: "visits-service",
      anomalies: 9,
      uptime: "1m 2s",
    });
  });
});
