import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { resolveSessionBoothSourceState } from "../../../src/features/session/sessionBoothSourceRuntime";

describe("sessionBoothSourceRuntime", () => {
  it("resolves source/base/adapter/signal for armed and live states", () => {
    expect(
      resolveSessionBoothSourceState({
        t: en,
        mode: "log",
        latestUpdate: null,
        playbackActive: false,
        liveMonitorActive: false,
        readyToRun: true,
        playbackPercent: null,
        activeSession: null,
        selectedSourceTitle: "customers-service",
        selectedSourcePath: "/logs/customers-service.log",
        selectedSourceSuggestedBpm: 124,
        selectedSessionSourceLabel: null,
        selectedSessionSourcePath: null,
        selectedBaseLabel: "Night Ops",
        selectedBaseDetail: "2 tracks · median 125 BPM",
        selectedSessionBaseLabel: null,
        selectedSessionBaseDetail: null,
        activeBaseLabel: null,
        activeBaseDetail: null,
        activeSourceLabel: null,
        activeSourcePath: null,
        monitorSession: null,
        monitorMetrics: { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
        isPlaybackPaused: false,
        playbackEventIndex: null,
        playbackEventCount: null,
      }).signalBpm,
    ).toBe(124);
  });
});
