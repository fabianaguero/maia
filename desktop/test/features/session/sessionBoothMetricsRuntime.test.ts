import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  resolveSessionBoothLevelEntries,
  resolveSessionBoothProgressWidth,
  resolveSessionBoothStats,
} from "../../../src/features/session/sessionBoothMetricsRuntime";

describe("sessionBoothMetricsRuntime", () => {
  it("resolves level entries, stats and progress width for live and replay states", () => {
    const latestUpdate = {
      hasData: true,
      confidence: 0.82,
      dominantLevel: "warn_spike",
      lineCount: 32,
      anomalyCount: 4,
      levelCounts: { info: 20, warn: 10, error: 2 },
    } as never;
    expect(resolveSessionBoothLevelEntries(latestUpdate)).toEqual([
      ["info", 20],
      ["warn", 10],
      ["error", 2],
    ]);
    expect(
      resolveSessionBoothStats({
        playbackActive: false,
        playbackEventIndex: null,
        playbackEventCount: null,
        activeSession: null,
        playbackPercent: null,
        signalBpm: 128,
        latestUpdate,
        monitorMetrics: { windowCount: 9, processedLines: 220, totalAnomalies: 11 },
        t: en,
      })[0],
    ).toEqual({
      label: en.session.signalBpm,
      value: "128",
      helper: "bpm",
    });
    expect(
      resolveSessionBoothProgressWidth({
        playbackActive: false,
        playbackPercent: null,
        latestUpdate,
        monitorMetrics: { windowCount: 9, processedLines: 220, totalAnomalies: 11 },
      }),
    ).toBe("100%");
    expect(
      resolveSessionBoothProgressWidth({
        playbackActive: true,
        playbackPercent: 64,
        latestUpdate: null,
        monitorMetrics: { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      }),
    ).toBe("64%");
  });
});
