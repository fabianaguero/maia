import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import { buildMonitorLiveStreamIdleMotionTickState } from "../../../src/features/simple/monitorLiveStreamIdleMotionControllerRuntime";

describe("monitorLiveStreamIdleMotionControllerRuntime", () => {
  it("returns null while the idle hold window has not elapsed", () => {
    const result = buildMonitorLiveStreamIdleMotionTickState({
      nowMs: 1200,
      lastStreamEventAtMs: 1000,
      idleHoldMs: 300,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      liveSuggestedBpm: null,
      trackBpm: 126,
      previous: createMonitorSignalBuffer(),
    });

    expect(result).toBeNull();
  });

  it("builds the next idle buffer once the stream is idle long enough", () => {
    const previous = createMonitorSignalBuffer();
    const result = buildMonitorLiveStreamIdleMotionTickState({
      nowMs: 2000,
      lastStreamEventAtMs: 1000,
      idleHoldMs: 300,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      liveSuggestedBpm: 128,
      trackBpm: 126,
      previous,
    });

    expect(result).not.toBeNull();
    expect(result?.[60]?.val).not.toBe(previous[60]?.val);
  });
});
