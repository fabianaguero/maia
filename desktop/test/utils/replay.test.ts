import { describe, expect, it } from "vitest";

import {
  buildReplayCumulativeMetrics,
  resolveReplayProgressForWindow,
  resolveReplayTargetIndex,
  resolveSteppedReplayIndex,
} from "../../src/utils/replay";

describe("replay utils", () => {
  it("builds cumulative metrics for replay windows", () => {
    const cumulative = buildReplayCumulativeMetrics([
      { lineCount: 12, anomalyCount: 1 },
      { lineCount: 5, anomalyCount: 0 },
      { lineCount: 9, anomalyCount: 2 },
    ]);

    expect(cumulative).toEqual([
      { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      { windowCount: 1, processedLines: 12, totalAnomalies: 1 },
      { windowCount: 2, processedLines: 17, totalAnomalies: 1 },
      { windowCount: 3, processedLines: 26, totalAnomalies: 3 },
    ]);
  });

  it("resolves scrub progress to a clamped replay event index", () => {
    expect(resolveReplayTargetIndex(0, 5)).toBe(0);
    expect(resolveReplayTargetIndex(0.5, 5)).toBe(2);
    expect(resolveReplayTargetIndex(1, 5)).toBe(4);
    expect(resolveReplayTargetIndex(2, 5)).toBe(4);
    expect(resolveReplayTargetIndex(-1, 5)).toBe(0);
    expect(resolveReplayTargetIndex(Number.NaN, 5)).toBe(0);
    expect(resolveReplayTargetIndex(0.5, 0)).toBe(0);
  });

  it("resolves stepped replay indexes from the currently displayed window", () => {
    expect(resolveSteppedReplayIndex(1, 5, 1)).toBe(1);
    expect(resolveSteppedReplayIndex(1, 5, -1)).toBe(0);
    expect(resolveSteppedReplayIndex(3, 5, -1)).toBe(1);
    expect(resolveSteppedReplayIndex(3, 5, 1)).toBe(3);
    expect(resolveSteppedReplayIndex(5, 5, 1)).toBe(4);
    expect(resolveSteppedReplayIndex(0, 5, 1)).toBe(1);
    expect(resolveSteppedReplayIndex(0, 0, 1)).toBe(0);
  });

  it("resolves replay progress for a 1-based window index", () => {
    expect(resolveReplayProgressForWindow(1, 5)).toBe(0);
    expect(resolveReplayProgressForWindow(3, 5)).toBe(0.5);
    expect(resolveReplayProgressForWindow(5, 5)).toBe(1);
    expect(resolveReplayProgressForWindow(10, 5)).toBe(1);
    expect(resolveReplayProgressForWindow(-2, 5)).toBe(0);
    expect(resolveReplayProgressForWindow(1, 1)).toBe(0);
  });
});
