import { describe, expect, it } from "vitest";

import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../../src/types/library";
import {
  appendSyncTailRows,
  buildSyncTailRows,
  formatConfidence,
  formatCursor,
  formatFrequency,
  levelCount,
  resolveAnomalySourceRows,
  resolveBackgroundTrackSecond,
  resolveParsedLineTone,
  resolveTailComponent,
} from "../../../../src/features/analyzer/components/liveLogMonitorPanelRuntime";

function createMarker(overrides: Partial<LiveLogMarker> = {}): LiveLogMarker {
  return {
    eventIndex: 1,
    level: "ERROR",
    component: "payments",
    excerpt: "HTTP 500",
    ...overrides,
  };
}

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/live.log",
    fromOffset: 100,
    toOffset: 180,
    hasData: true,
    summary: "window",
    suggestedBpm: 126,
    confidence: 0.84,
    dominantLevel: "warn",
    lineCount: 4,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1, info: 1 },
    anomalyMarkers: [createMarker()],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["INFO connected", "WARN retry in progress", "ERROR HTTP 500 while syncing"],
    warnings: [],
    replayWindowIndex: 2,
    ...overrides,
  };
}

describe("liveLogMonitorPanelRuntime", () => {
  it("formats cursor, confidence and frequency helpers", () => {
    expect(formatCursor(undefined)).toBe("Tail seed");
    expect(formatCursor(1536)).toBe("1,536 B");
    expect(formatConfidence(0)).toBe("--");
    expect(formatConfidence(0.842)).toBe("84%");
    expect(formatFrequency(441.6)).toBe("442 Hz");
  });

  it("resolves background track second with looping and clamp behavior", () => {
    expect(
      resolveBackgroundTrackSecond(
        { currentTime: 12 },
        {
          startedAtContextTime: 10,
          bufferDurationSec: 8,
          entrySecond: 3,
          playbackRate: 1,
          looping: true,
        },
      ),
    ).toBe(5);

    expect(
      resolveBackgroundTrackSecond(
        { currentTime: 12 },
        {
          startedAtContextTime: 10,
          bufferDurationSec: 4,
          entrySecond: 3,
          playbackRate: 1,
          looping: false,
        },
      ),
    ).toBe(4);
  });

  it("derives tone and component from parsed lines and markers", () => {
    const markers = [createMarker()];
    expect(resolveParsedLineTone("ERROR HTTP 500 while syncing", markers)).toBe("anomaly");
    expect(resolveParsedLineTone("WARN retry in progress", markers)).toBe("warn");
    expect(resolveParsedLineTone("INFO connected", markers)).toBe("info");
    expect(resolveTailComponent("ERROR HTTP 500 while syncing", markers)).toBe("payments");
    expect(resolveTailComponent("WARN retry in progress", [])).toBe("stream");
  });

  it("builds anomaly source rows and avoids duplicates", () => {
    const rows = resolveAnomalySourceRows(
      createUpdate({
        parsedLines: [
          "ERROR HTTP 500 while syncing",
          "WARN retry in progress",
          "WARN retry in progress",
        ],
      }),
      4,
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]?.component).toBe("payments");
    expect(rows[1]?.tone).toBe("anomaly");
    expect(rows[2]?.tone).toBe("warn");
  });

  it("builds and appends sync tail rows with a stable cap", () => {
    const nextRows = buildSyncTailRows({
      update: createUpdate(),
      maxParsedLines: 2,
    });

    expect(nextRows).toHaveLength(2);
    expect(nextRows[0]?.windowId).toBe("100-180-2");
    expect(nextRows[1]?.level).toBe("anomaly");

    const capped = appendSyncTailRows(
      [
        {
          id: "old-1",
          windowId: "old",
          sourcePath: "/logs/live.log",
          component: "stream",
          level: "info",
          line: "old",
          tone: "info",
        },
      ],
      nextRows,
      2,
    );

    expect(capped).toHaveLength(2);
    expect(capped[0]?.id).toBe(nextRows[0]?.id);
  });

  it("counts levels safely", () => {
    expect(levelCount({ warn: 2 }, "warn")).toBe(2);
    expect(levelCount({ warn: 2 }, "error")).toBe(0);
  });
});
