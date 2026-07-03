import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildMonitorSetupPreviewMeters,
  buildMonitorSetupSignalChainCards,
  buildMonitorSetupSummaryCards,
  buildMonitorSetupTransportCards,
  formatMonitorDeckAlertShape,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckDuckingIntensity,
  formatMonitorDeckMasterVolume,
  formatMonitorDeckRecoveryRelease,
  formatMonitorDeckWaveZoom,
} from "../../../src/features/simple/monitorSetupDeckMetricsRuntime";

function createInput(
  overrides?: Partial<{
    lang: "en" | "es";
    skin: "nightfall" | "arctic" | "copper";
    alertShape: "soft" | "tight" | "aggressive";
    beatSnapSubdivision: number;
  }>,
) {
  return {
    controls: {
      ...DEFAULT_MONITOR_DECK_CONTROLS,
      alertShape: overrides?.alertShape ?? DEFAULT_MONITOR_DECK_CONTROLS.alertShape,
      beatSnapSubdivision:
        overrides?.beatSnapSubdivision ?? DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision,
    },
    lang: overrides?.lang ?? "en",
    skin: overrides?.skin ?? "nightfall",
    activePreset: "balanced" as const,
    isDirty: false,
    setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
    t: en,
  };
}

describe("monitorSetupDeckMetricsRuntime", () => {
  it("formats beat snap, cooldown and volume-related values", () => {
    expect(formatMonitorDeckBeatSnap(0.5, en)).toBe(en.simpleMode.deckSetup.beatHalf);
    expect(formatMonitorDeckBeatSnap(0.125, en)).toBe(en.simpleMode.deckSetup.beatEighth);
    expect(formatMonitorDeckBeatSnap(0.25, en)).toBe(en.simpleMode.deckSetup.beatQuarter);
    expect(formatMonitorDeckCooldown(2650)).toBe("2.7s");
    expect(formatMonitorDeckWaveZoom(1.25)).toBe("1.3x");
    expect(formatMonitorDeckMasterVolume(0.42)).toBe("42%");
    expect(formatMonitorDeckDuckingIntensity(58.4)).toBe("58%");
    expect(formatMonitorDeckRecoveryRelease(61.6)).toBe("62%");
  });

  it("formats alert shape labels for all supported variants", () => {
    expect(formatMonitorDeckAlertShape("soft", en)).toBe(en.simpleMode.deckSetup.alertShapeSoft);
    expect(formatMonitorDeckAlertShape("aggressive", en)).toBe(
      en.simpleMode.deckSetup.alertShapeAggressive,
    );
    expect(formatMonitorDeckAlertShape("tight", en)).toBe(en.simpleMode.deckSetup.alertShapeTight);
  });

  it("builds summary, signal chain, transport and preview cards for multiple locales and skins", () => {
    const english = createInput();
    const spanishArctic = createInput({
      lang: "es",
      skin: "arctic",
      alertShape: "soft",
      beatSnapSubdivision: 0.5,
    });
    const copper = createInput({
      skin: "copper",
      alertShape: "aggressive",
      beatSnapSubdivision: 0.125,
    });

    const summaryCards = buildMonitorSetupSummaryCards(copper);
    const englishSignalChain = buildMonitorSetupSignalChainCards(english);
    const spanishSignalChain = buildMonitorSetupSignalChainCards(spanishArctic);
    const transportCards = buildMonitorSetupTransportCards({
      setupPreferences: {
        defaultCloudLookback: "120m",
        idleHoldMs: 1500,
        tailWindowRows: 1600,
      },
      t: en,
    });
    const previewMeters = buildMonitorSetupPreviewMeters(copper);

    expect(summaryCards).toHaveLength(7);
    expect(summaryCards.at(-1)).toEqual(
      expect.objectContaining({
        key: "alert-shape",
        value: en.simpleMode.deckSetup.alertShapeAggressive,
      }),
    );
    expect(englishSignalChain[0]?.value).toBe(en.simpleMode.deckSetup.english);
    expect(englishSignalChain[1]?.value).toBe(en.simpleMode.deckSetup.skinNightfall);
    expect(spanishSignalChain[0]?.value).toBe(en.simpleMode.deckSetup.spanish);
    expect(spanishSignalChain[1]?.value).toBe(en.simpleMode.deckSetup.skinArctic);
    expect(spanishSignalChain[3]?.value).toBe(en.simpleMode.deckSetup.beatHalf);
    expect(buildMonitorSetupSignalChainCards(copper)[1]?.value).toBe(
      en.simpleMode.deckSetup.skinCopper,
    );
    expect(transportCards).toEqual([
      {
        key: "cloud-lookback",
        label: en.simpleMode.deckSetup.cloudLookbackDefault,
        value: "120m",
      },
      {
        key: "idle-hold",
        label: en.simpleMode.deckSetup.idleHold,
        value: "1.5s",
      },
      {
        key: "tail-window-rows",
        label: en.simpleMode.deckSetup.tailWindowRows,
        value: "1600 rows",
      },
    ]);
    expect(previewMeters).toEqual([
      { key: "bed", label: en.simpleMode.deckSetup.previewTrackBed, value: 40 },
      { key: "reaction", label: en.simpleMode.deckSetup.previewLogReaction, value: 72 },
      { key: "contrast", label: en.simpleMode.deckSetup.previewAlertContrast, value: 63 },
      { key: "idle", label: en.simpleMode.deckSetup.previewIdleDrift, value: 34 },
    ]);
  });
});
