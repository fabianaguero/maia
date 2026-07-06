import { describe, expect, it } from "vitest";

import {
  ARRANGEMENT_TRACKS,
  buildArrangementLanes,
  hasMonitorNotes,
  markerKey,
} from "../../src/features/analyzer/components/liveLogMonitorPerformanceSummaryRuntime";

describe("liveLogMonitorPerformanceSummaryRuntime", () => {
  it("builds stable arrangement lanes in deck order", () => {
    const lanes = buildArrangementLanes([
      {
        cue: {
          id: "cue-1",
          eventIndex: 1,
          component: "payments",
          excerpt: "timeout",
          noteHz: 220,
          durationMs: 120,
          gain: 0.6,
          level: "warn",
          waveform: "triangle",
          routeLabel: "monitor",
          routeKey: "warn",
          stemLabel: "stem",
          sectionLabel: "bridge",
          accent: "warn",
          trackRole: "motion",
          timeOffsetMs: 0,
          pan: 0,
          focus: "focus",
          samplePath: null,
          sampleLabel: null,
        },
        track: "motion",
        panOffset: 0,
        noteMultiplier: 1,
        gainMultiplier: 1,
        timeOffsetMs: 0,
      },
    ]);

    expect(lanes.map((lane) => lane.track)).toEqual(ARRANGEMENT_TRACKS);
    expect(lanes[1].voices).toHaveLength(1);
    expect(lanes[0].voices).toHaveLength(0);
  });

  it("resolves monitor notes presence from error or warnings", () => {
    expect(hasMonitorNotes(null, [])).toBe(false);
    expect(hasMonitorNotes("boom", [])).toBe(true);
    expect(hasMonitorNotes(null, ["warn"])).toBe(true);
  });

  it("builds stable marker keys", () => {
    expect(
      markerKey({
        eventIndex: 3,
        component: "payments",
        excerpt: "timeout",
        level: "warn",
      }),
    ).toBe("3-payments-warn");
  });
});
