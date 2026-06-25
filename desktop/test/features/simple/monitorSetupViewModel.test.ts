import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildMonitorSetupScreenViewModel,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckWaveZoom,
} from "../../../src/features/simple/monitorSetupViewModel";

describe("monitorSetupViewModel", () => {
  it("formats beat snap values using translated labels", () => {
    expect(formatMonitorDeckBeatSnap(0.5, en)).toBe(en.simpleMode.deckSetup.beatHalf);
    expect(formatMonitorDeckBeatSnap(0.125, en)).toBe(en.simpleMode.deckSetup.beatEighth);
    expect(formatMonitorDeckBeatSnap(0.25, en)).toBe(en.simpleMode.deckSetup.beatQuarter);
  });

  it("formats cooldown and wave zoom values for deck summaries", () => {
    expect(formatMonitorDeckCooldown(2600)).toBe("2.6s");
    expect(formatMonitorDeckWaveZoom(1)).toBe("1.0x");
    expect(formatMonitorDeckWaveZoom(2.35)).toBe("2.4x");
  });

  it("builds summary and signal-chain cards for the setup rack", () => {
    const viewModel = buildMonitorSetupScreenViewModel({
      controls: {
        waveformScale: 1.6,
        reactivity: 74,
        anomalyEmphasis: 61,
        idleMotion: 29,
        cueCooldownMs: 1800,
        beatSnapSubdivision: 0.125,
      },
      lang: "es",
      t: en,
    });

    expect(viewModel.summaryCards).toHaveLength(3);
    expect(viewModel.summaryCards[0]).toMatchObject({
      key: "reactive-mix",
      value: "74%",
    });
    expect(viewModel.signalChainCards).toEqual([
      {
        key: "language",
        label: en.simpleMode.deckSetup.languageBank,
        value: en.simpleMode.deckSetup.spanish,
      },
      {
        key: "wave-zoom",
        label: en.simpleMode.deckSetup.waveZoom,
        value: "1.6x",
      },
      {
        key: "beat-snap",
        label: en.simpleMode.deckSetup.beatSnap,
        value: en.simpleMode.deckSetup.beatEighth,
      },
      {
        key: "cue-cooldown",
        label: en.simpleMode.deckSetup.cueCooldown,
        value: "1.8s",
      },
    ]);
  });
});
