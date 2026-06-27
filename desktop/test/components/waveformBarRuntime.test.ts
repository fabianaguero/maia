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
});
