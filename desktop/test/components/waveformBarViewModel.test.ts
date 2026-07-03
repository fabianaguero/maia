import { describe, expect, it } from "vitest";

import {
  buildAlertChannelBars,
  buildLogChannelBars,
} from "../../src/components/waveformBarViewModel";

describe("waveformBarViewModel", () => {
  it("builds deterministic log channel bars", () => {
    const bars = buildLogChannelBars(3, true, () => 0.5);

    expect(bars).toEqual([
      { height: "45%", animationDelay: "0s", opacity: 0.9 },
      { height: "45%", animationDelay: "0.05s", opacity: 0.9 },
      { height: "45%", animationDelay: "0.1s", opacity: 0.9 },
    ]);

    expect(buildLogChannelBars(1, false, () => 0.5)).toEqual([
      { height: "10%", animationDelay: "0s", opacity: 0.4 },
    ]);
  });

  it("builds alert channel bars with anomaly-driven intensity", () => {
    const activeBars = buildAlertChannelBars(2, true, 4, () => 0.5);
    expect(activeBars).toEqual([
      { height: "77%", animationDelay: "0s", filter: "brightness(1.4)" },
      { height: "77%", animationDelay: "0.05s", filter: "brightness(1.4)" },
    ]);

    const idleBars = buildAlertChannelBars(1, false, 0, () => 0.5);
    expect(idleBars).toEqual([{ height: "10%", animationDelay: "0s", filter: "none" }]);

    const activeIdleBars = buildAlertChannelBars(1, true, 0, () => 0.5);
    expect(activeIdleBars).toEqual([{ height: "15%", animationDelay: "0s", filter: "none" }]);
  });
});
