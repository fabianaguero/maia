import { describe, expect, it } from "vitest";

import {
  buildSimpleMonitorLiveTailEffectState,
  buildSimpleMonitorLiveTailFocusState,
  buildSimpleMonitorLiveTailScrollState,
} from "../../../src/features/simple/simpleMonitorLiveTailRuntime";

describe("simpleMonitorLiveTailRuntime", () => {
  it("builds focus, pin, and none tail sync states", () => {
    expect(
      buildSimpleMonitorLiveTailEffectState({
        liveLines: [
          {
            id: "line-1",
            timestamp: "10:00:00",
            level: "warn",
            message: "timeout",
            isAnomaly: true,
            anomalyId: "anomaly-1",
          },
        ],
        selectedAnomalyId: "anomaly-1",
        shouldFocusSelectedLog: true,
        isTailPinned: true,
      }),
    ).toEqual({
      type: "focus",
      lineId: "line-1",
    });

    expect(
      buildSimpleMonitorLiveTailEffectState({
        liveLines: [],
        selectedAnomalyId: null,
        shouldFocusSelectedLog: false,
        isTailPinned: true,
      }),
    ).toEqual({ type: "pin" });

    expect(
      buildSimpleMonitorLiveTailEffectState({
        liveLines: [],
        selectedAnomalyId: null,
        shouldFocusSelectedLog: false,
        isTailPinned: false,
      }),
    ).toEqual({ type: "none" });
  });

  it("builds scroll and focus state deterministically", () => {
    expect(
      buildSimpleMonitorLiveTailScrollState({
        distanceFromBottom: 4,
      }),
    ).toEqual({ isTailPinned: true });
    expect(
      buildSimpleMonitorLiveTailScrollState({
        distanceFromBottom: 80,
      }),
    ).toEqual({ isTailPinned: false });
    expect(buildSimpleMonitorLiveTailFocusState("anomaly-1")).toEqual({
      shouldFocusSelectedLog: true,
      anomalyId: "anomaly-1",
    });
  });
});
