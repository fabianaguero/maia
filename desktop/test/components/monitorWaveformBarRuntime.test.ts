import { describe, expect, it } from "vitest";

import type { LiveLogStreamUpdate } from "../../src/types/monitor";
import {
  appendWaveHistory,
  buildHudLinesForUpdate,
  buildWaveColumn,
  MONITOR_WAVEFORM_HISTORY_SIZE,
  resolveProcessedMetrics,
  resolveSourceMetrics,
} from "../../src/components/monitorWaveformBarRuntime";

function createUpdate(
  overrides: Partial<LiveLogStreamUpdate> = {},
): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/services.log",
    fromOffset: 0,
    toOffset: 64,
    hasData: true,
    summary: "stream active",
    suggestedBpm: 126,
    confidence: 0.82,
    dominantLevel: "warn",
    lineCount: 4,
    anomalyCount: 1,
    levelCounts: { info: 2, warn: 1, error: 1 },
    anomalyMarkers: [
      {
        eventIndex: 1,
        level: "error",
        component: "services",
        excerpt: "Timeout upstream",
      },
    ],
    topComponents: [{ component: "services", count: 4 }],
    sonificationCues: [
      {
        id: "cue-1",
        eventIndex: 1,
        level: "error",
        component: "services",
        excerpt: "Timeout upstream",
        noteHz: 220,
        durationMs: 140,
        gain: 0.2,
        waveform: "triangle",
        accent: "anomaly",
      },
    ],
    parsedLines: [
      "INFO boot complete",
      "ERROR Timeout upstream",
    ],
    warnings: [],
    ...overrides,
  };
}

describe("monitorWaveformBarRuntime", () => {
  it("normalizes source and processed metrics from log updates", () => {
    const update = createUpdate();

    expect(resolveSourceMetrics(update, 0.5)).toEqual({
      low: expect.any(Number),
      mid: expect.any(Number),
      high: expect.any(Number),
    });
    expect(resolveSourceMetrics(createUpdate({ lineCount: 0 }), 0.5)).toEqual({
      low: 0,
      mid: 0,
      high: 0,
    });

    expect(resolveProcessedMetrics(update.sonificationCues, update)).toEqual({
      low: expect.any(Number),
      mid: expect.any(Number),
      high: expect.any(Number),
    });
    expect(resolveProcessedMetrics([], createUpdate({ anomalyMarkers: [] }))).toEqual({
      low: 0,
      mid: 0,
      high: 0,
    });
  });

  it("builds HUD lines only for new offsets or replay events", () => {
    const parsedUpdate = createUpdate({ toOffset: 120 });
    expect(
      buildHudLinesForUpdate(parsedUpdate, {
        isPlayback: false,
        lastOffset: 10,
        now: 1000,
        randomValue: 0.42,
      }),
    ).toEqual({
      hudLines: [
        {
          id: "120-1-0.42",
          content: "ERROR Timeout upstream",
          heat: 0.4,
          timestamp: 1000,
        },
        {
          id: "120-0-0.42",
          content: "INFO boot complete",
          heat: 0.4,
          timestamp: 1000,
        },
      ],
      nextOffset: 120,
    });

    expect(
      buildHudLinesForUpdate(createUpdate({ parsedLines: [], toOffset: 120 }), {
        isPlayback: false,
        lastOffset: 120,
      }),
    ).toEqual({
      hudLines: [],
      nextOffset: 120,
    });

    expect(
      buildHudLinesForUpdate(createUpdate({ parsedLines: [], anomalyMarkers: [], lineCount: 7 }), {
        isPlayback: false,
        lastOffset: 1,
        now: 2000,
      }),
    ).toEqual({
      hudLines: [
        {
          id: "64",
          content: ">> Ingesting telemetry burst: 7 lines",
          heat: 0.2,
          timestamp: 2000,
        },
      ].map((line) => ({ ...line, id: "burst-64" })),
      nextOffset: 64,
    });

    expect(
      buildHudLinesForUpdate(createUpdate({ parsedLines: [] }), {
        isPlayback: true,
        lastOffset: 999,
        now: 3000,
      }).hudLines[0]?.content,
    ).toContain("[ANOMALY]");
  });

  it("builds and trims wave history deterministically", () => {
    const update = createUpdate();
    const source = resolveSourceMetrics(update, 0.1);
    const processed = resolveProcessedMetrics(update.sonificationCues, update);
    const column = buildWaveColumn(update, source, processed);

    expect(column.logLine).toBe("INFO boot complete");
    expect(column.anomalyHeat).toBe(0.4);

    const history = Array.from({ length: MONITOR_WAVEFORM_HISTORY_SIZE }, () => column);
    const nextHistory = appendWaveHistory(history, column);
    expect(nextHistory).toHaveLength(MONITOR_WAVEFORM_HISTORY_SIZE);
    expect(nextHistory.at(-1)).toEqual(column);
  });
});
