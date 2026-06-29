import { describe, expect, it } from "vitest";

import {
  buildRecentCueHistory,
  buildRecentExplanationHistory,
  buildRecentMarkerHistory,
  buildRecentMonitorVoices,
  mergeKnownMonitorComponents,
  resolveActiveTailWindowId,
  resolveSelectedMonitorExplanationId,
} from "../../src/features/analyzer/components/liveLogMonitorStreamUpdateRuntime";
import type { LiveMutationExplanation } from "../../src/utils/liveMutationExplainability";
import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";

function cue(id: number, routeKey: RoutedLiveCue["routeKey"] = "info"): RoutedLiveCue {
  return {
    component: "api",
    level: routeKey === "error" ? "ERROR" : "INFO",
    routeKey,
    eventIndex: id,
    noteHz: 220,
    gain: 0.2,
    pan: 0,
    waveform: "sine",
    durationMs: 120,
    accent: routeKey === "anomaly" ? "anomaly" : "none",
    samplePath: null,
    sourceLine: "line",
    excerpt: null,
    mutationTag: null,
  } as RoutedLiveCue;
}

function explanation(id: string): LiveMutationExplanation {
  return {
    id,
    summary: id,
    detail: id,
    eventIndex: 0,
    cueLabel: id,
    routeKey: "info",
    trackId: null,
    trackTitle: null,
    trackSecond: null,
  };
}

describe("liveLogMonitorStreamUpdateRuntime", () => {
  it("merges known components without duplicating them", () => {
    expect(mergeKnownMonitorComponents(["api"], ["api", "db", "cache"], 3)).toEqual({
      knownComponents: ["api", "db", "cache"],
      changed: true,
    });
  });

  it("builds recent cue, marker, and explanation histories in reverse recency order", () => {
    const cues = buildRecentCueHistory([cue(9)], [cue(1), cue(2)], "primary log", 3);
    expect(cues).toHaveLength(3);
    expect(cues[0]?.eventIndex).toBe(2);

    const markers = buildRecentMarkerHistory(
      [{ component: "old", excerpt: "old", level: "WARN" } as any],
      [
        { component: "a", excerpt: "a", level: "WARN" },
        { component: "b", excerpt: "b", level: "ERROR" },
      ] as any,
      3,
    );
    expect(markers[0]?.excerpt).toBe("b");

    const explanations = buildRecentExplanationHistory(
      [explanation("old")],
      [explanation("new")],
      2,
    );
    expect(explanations.map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("resolves selected explanation, active tail window, and recent voices", () => {
    expect(resolveSelectedMonitorExplanationId(null, [explanation("x")], false)).toBe("x");
    expect(resolveSelectedMonitorExplanationId("keep", [explanation("x")], false)).toBe("keep");
    expect(resolveSelectedMonitorExplanationId("keep", [explanation("x")], true)).toBe("x");

    expect(resolveActiveTailWindowId([{ windowId: "w-1" } as any])).toBe("w-1");
    expect(buildRecentMonitorVoices([cue(1), cue(2, "error")], "full", 12).length).toBeGreaterThan(
      0,
    );
  });
});
