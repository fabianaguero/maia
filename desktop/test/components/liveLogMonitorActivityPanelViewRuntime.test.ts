import { describe, expect, it } from "vitest";

import {
  buildHorizontalTailCellStyle,
  buildLiveWaveBarStyle,
} from "../../src/features/analyzer/components/liveLogMonitorActivityPanelViewRuntime";
import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";

function createCue(overrides: Partial<RoutedLiveCue> = {}): RoutedLiveCue {
  return {
    id: "cue-1",
    eventIndex: 1,
    component: "payments",
    excerpt: "error timeout",
    noteHz: 220,
    durationMs: 150,
    gain: 0.6,
    level: "error",
    waveform: "square",
    routeLabel: "alert",
    routeKey: "anomaly",
    stemLabel: "stem",
    sectionLabel: "phrase",
    accent: "anomaly",
    trackRole: "accent",
    pan: 0,
    focus: "alerts",
    samplePath: null,
    sampleLabel: null,
    timeOffsetMs: 0,
    ...overrides,
  };
}

describe("liveLogMonitorActivityPanelViewRuntime", () => {
  it("builds anomaly bars with taller emphasis", () => {
    expect(buildLiveWaveBarStyle(createCue(), 1, 8)).toEqual({
      "--bar-height": "240px",
      "--bar-opacity": 0.875,
    });
  });

  it("builds non-anomaly bars with lower minimum height", () => {
    expect(buildLiveWaveBarStyle(createCue({ accent: "info", gain: 0.02 }), 2, 8)).toEqual({
      "--bar-height": "10px",
      "--bar-opacity": 0.75,
    });
  });

  it("builds horizontal tail opacity falloff", () => {
    expect(buildHorizontalTailCellStyle(3, 8)).toEqual({
      "--cell-opacity": 0.625,
    });
  });
});
