import { describe, expect, it } from "vitest";

import { updateLiveLogMonitorComponentOverrides } from "../../src/features/analyzer/components/liveLogMonitorRoutingRuntime";

describe("liveLogMonitorRoutingRuntime", () => {
  it("returns a new overrides map while preserving existing entries", () => {
    const current = new Map([["api", { gainMult: 0.8, muted: false }]]);

    const next = updateLiveLogMonitorComponentOverrides(current, "worker", {
      gainMult: 0.6,
      muted: true,
    });

    expect(next).not.toBe(current);
    expect(Array.from(current.entries())).toEqual([["api", { gainMult: 0.8, muted: false }]]);
    expect(Array.from(next.entries())).toEqual([
      ["api", { gainMult: 0.8, muted: false }],
      ["worker", { gainMult: 0.6, muted: true }],
    ]);
  });
});
