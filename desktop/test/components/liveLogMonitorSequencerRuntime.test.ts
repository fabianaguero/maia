import { describe, expect, it } from "vitest";

import {
  buildSequencerPlaybackPlan,
  resolveSequencerPreviewVolume,
} from "../../src/features/analyzer/components/liveLogMonitorSequencerRuntime";

describe("liveLogMonitorSequencerRuntime", () => {
  it("splits immediate and deferred firings by humanize offset", () => {
    const plan = buildSequencerPlaybackPlan([
      { track: "foundation", step: 0, humanizeOffsetMs: 0 },
      { track: "motion", step: 1, humanizeOffsetMs: 4 },
      { track: "accent", step: 2, humanizeOffsetMs: 12 },
    ]);

    expect(plan.immediate).toHaveLength(2);
    expect(plan.deferred).toHaveLength(1);
    expect(plan.deferred[0]?.track).toBe("accent");
  });

  it("caps sequencer preview volume against master volume", () => {
    expect(resolveSequencerPreviewVolume(0.2)).toBeCloseTo(0.08);
    expect(resolveSequencerPreviewVolume(1)).toBe(0.18);
  });
});
