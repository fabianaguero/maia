import { describe, expect, it } from "vitest";

import { appendLiveLogMonitorWarningMessage } from "../../../../src/features/analyzer/components/liveLogMonitorPanelAudioFeedbackRuntime";

describe("liveLogMonitorPanelAudioFeedbackRuntime", () => {
  it("prepends and caps recent warning messages", () => {
    expect(
      appendLiveLogMonitorWarningMessage(
        ["w1", "w2", "w3", "w4"],
        "decode failed",
      ),
    ).toEqual([
      "Base sample routing failed: decode failed",
      "w1",
      "w2",
      "w3",
    ]);
  });
});
