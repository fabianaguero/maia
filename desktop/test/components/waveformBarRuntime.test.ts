import { describe, expect, it } from "vitest";

import { buildWaveformBarViewModel } from "../../src/components/waveformBarRuntime";
import { en } from "../../src/i18n/en";

describe("waveformBarRuntime", () => {
  it("returns null when the floating bar is inactive", () => {
    expect(
      buildWaveformBarViewModel({
        t: en,
        isActive: false,
      }),
    ).toBeNull();
  });

  it("normalizes defaults and bar content for active sessions", () => {
    const viewModel = buildWaveformBarViewModel({
      t: en,
      isActive: true,
      anomalies: 3.9,
      random: () => 0.5,
    });

    expect(viewModel).toMatchObject({
      sourceLabel: en.simpleMode.common.unknown,
      anomaliesValue: 3,
      uptimeLabel: "0s",
    });
    expect(viewModel?.logBars[0]).toEqual({
      height: "45%",
      animationDelay: "0s",
      opacity: 0.9,
    });
    expect(viewModel?.alertBars[0]).toEqual({
      height: "69%",
      animationDelay: "0s",
      filter: "brightness(1.3)",
    });
  });

  it("normalizes whitespace, negative anomalies, and implicit active state", () => {
    const viewModel = buildWaveformBarViewModel({
      t: en,
      source: "   ",
      uptime: "   ",
      anomalies: -3,
      random: () => 0.25,
    });

    expect(viewModel).toMatchObject({
      sourceLabel: en.simpleMode.common.unknown,
      anomaliesValue: 0,
      uptimeLabel: "0s",
    });
  });

  it("accepts a null anomaly count and preserves explicit source and uptime", () => {
    const viewModel = buildWaveformBarViewModel({
      t: en,
      source: "services.log",
      uptime: "12s",
      anomalies: null,
      random: () => 0.1,
    });

    expect(viewModel).toMatchObject({
      sourceLabel: "services.log",
      anomaliesValue: 0,
      uptimeLabel: "12s",
    });
  });
});
