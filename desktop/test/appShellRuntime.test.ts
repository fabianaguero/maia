import { describe, expect, it } from "vitest";

import {
  buildAppMonitorOverviewState,
  buildAppTopbarState,
} from "../src/appShellRuntime";

describe("appShellRuntime", () => {
  it("shows the expert topbar subtitle and simple lockup in the right modes", () => {
    expect(buildAppTopbarState("simple")).toEqual({
      showWordmark: false,
      showLockup: true,
      showWorkspaceSubtitle: false,
    });

    expect(buildAppTopbarState("expert")).toEqual({
      showWordmark: true,
      showLockup: false,
      showWorkspaceSubtitle: true,
    });
  });

  it("shows the monitor overview only when expert mode has a selected title", () => {
    expect(
      buildAppMonitorOverviewState({
        userMode: "simple",
        selectedItemTitle: " Track 1 ",
        hasMonitorSession: true,
        totalAnomalies: 4,
        anomalyLabel: "Anomalies",
      }),
    ).toMatchObject({
      selectedItemTitle: "Track 1",
      show: false,
      showLiveStatus: false,
      anomalyCountLabel: null,
    });

    expect(
      buildAppMonitorOverviewState({
        userMode: "expert",
        selectedItemTitle: " Track 1 ",
        hasMonitorSession: true,
        totalAnomalies: 4,
        anomalyLabel: "Anomalies",
      }),
    ).toMatchObject({
      selectedItemTitle: "Track 1",
      show: true,
      showLiveStatus: true,
      anomalyCountLabel: "4 anomalies",
    });
  });
});
