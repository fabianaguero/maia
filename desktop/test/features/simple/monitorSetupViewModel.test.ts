import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  formatMonitorDeckAlertShape,
  buildMonitorSetupScreenViewModel,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckDuckingIntensity,
  formatMonitorDeckMasterVolume,
  formatMonitorDeckRecoveryRelease,
  formatMonitorDeckWaveZoom,
} from "../../../src/features/simple/monitorSetupViewModel";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";

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
    expect(formatMonitorDeckMasterVolume(0.4)).toBe("40%");
    expect(formatMonitorDeckDuckingIntensity(58)).toBe("58%");
    expect(formatMonitorDeckRecoveryRelease(62)).toBe("62%");
    expect(formatMonitorDeckAlertShape("tight", en)).toBe(en.simpleMode.deckSetup.alertShapeTight);
  });

  it("builds summary and signal-chain cards for the setup rack", () => {
    const viewModel = buildMonitorSetupScreenViewModel({
      controls: {
        waveformScale: 1.6,
        reactivity: 74,
        anomalyEmphasis: 61,
        idleMotion: 29,
        masterVolume: 0.4,
        duckingIntensity: 58,
        recoveryRelease: 62,
        alertShape: "tight",
        cueCooldownMs: 1800,
        beatSnapSubdivision: 0.125,
      },
      lang: "es",
      skin: "copper",
      activePreset: "balanced",
      isDirty: false,
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });

    expect(viewModel.summaryCards).toHaveLength(7);
    expect(viewModel.summaryCards[0]).toMatchObject({
      key: "reactive-mix",
      value: "74%",
    });
    expect(viewModel.summaryCards[3]).toMatchObject({
      key: "monitor-level",
      value: "40%",
    });
    expect(viewModel.summaryCards[4]).toMatchObject({
      key: "ducking-intensity",
      value: "58%",
    });
    expect(viewModel.summaryCards[5]).toMatchObject({
      key: "recovery-release",
      value: "62%",
    });
    expect(viewModel.summaryCards[6]).toMatchObject({
      key: "alert-shape",
      value: en.simpleMode.deckSetup.alertShapeTight,
    });
    expect(viewModel.signalChainCards).toEqual([
      {
        key: "language",
        label: en.simpleMode.deckSetup.languageBank,
        value: en.simpleMode.deckSetup.spanish,
      },
      {
        key: "skin",
        label: en.simpleMode.deckSetup.skinBank,
        value: en.simpleMode.deckSetup.skinCopper,
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
    expect(viewModel.transportCards).toEqual([
      {
        key: "cloud-lookback",
        label: en.simpleMode.deckSetup.cloudLookbackDefault,
        value: "10m",
      },
      {
        key: "idle-hold",
        label: en.simpleMode.deckSetup.idleHold,
        value: "0.9s",
      },
      {
        key: "tail-window-rows",
        label: en.simpleMode.deckSetup.tailWindowRows,
        value: "1200 rows",
      },
    ]);
    expect(viewModel.runtimeDefaultFields.map((field) => field.key)).toEqual([
      "defaultCloudLookback",
      "idleHoldMs",
      "tailWindowRows",
    ]);
    expect(viewModel.runtimeDefaultGroups.map((group) => group.key)).toEqual([
      "cloud-defaults",
      "stream-runtime",
    ]);
    expect(viewModel.runtimeDefaultFields[1]).toMatchObject({
      key: "idleHoldMs",
      group: "stream-runtime",
      min: 250,
      max: 10_000,
      step: 100,
      valueLabel: "0.9s",
    });
  });
});
