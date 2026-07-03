import type { MonitorDeckPalette, MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";
import { resolvePresetGlowAlpha } from "./monitorDeckGlowAlphaRuntime";

export function buildMonitorDeckCopperSkinPalette(
  base: MonitorDeckPalette,
  preset: MonitorDeckVisualPreset,
  withAlpha: (color: string, alpha: number) => string,
): MonitorDeckPalette {
  return {
    ...base,
    backgroundTop: "rgba(22,14,13,0.98)",
    backgroundMid: "rgba(11,7,7,0.99)",
    backgroundBottom: "rgba(4,2,2,1)",
    separatorLine: "rgba(255,220,180,0.05)",
    trackGlow: withAlpha(
      "rgba(255,176,102,1)",
      resolvePresetGlowAlpha(preset, { passive: 0.1, balanced: 0.14, alert: 0.18 }),
    ),
    overviewBaseGlow: withAlpha(
      "rgba(255,176,102,1)",
      resolvePresetGlowAlpha(preset, { passive: 0.14, balanced: 0.2, alert: 0.24 }),
    ),
    overviewFillStops: [
      "rgba(255,132,102,0.86)",
      "rgba(255,182,96,0.9)",
      "rgba(246,206,99,0.88)",
      "rgba(255,174,90,0.9)",
      "rgba(255,216,164,0.86)",
      "rgba(255,236,206,0.8)",
    ],
    phraseCool: "rgba(255,214,164,0.84)",
    phraseMid: "rgba(246,206,99,0.84)",
    phraseWarm: "rgba(255,182,96,0.88)",
    phraseHot: "rgba(255,120,96,0.92)",
    trackTopCool: "rgba(255,232,204,0.9)",
    trackBottomCool: "rgba(255,176,102,0.42)",
    trackTopMid: "rgba(246,218,132,0.9)",
    trackBottomMid: "rgba(255,180,104,0.16)",
    trackTopWarm: "rgba(255,186,104,0.92)",
    trackBottomWarm: "rgba(255,136,96,0.2)",
    trackTopHot: "rgba(255,118,84,0.96)",
    trackBottomHot: "rgba(255,92,122,0.22)",
    centerLine: "rgba(255,176,102,0.92)",
    logGlowTop: "rgba(255,194,116,0)",
    logGlowMid: "rgba(255,194,116,0.12)",
    logGlowBottom: "rgba(255,176,102,0.08)",
    logCool: "rgba(255,186,116,0.28)",
    logWarm: "rgba(246,206,99,0.6)",
    logHot: "rgba(255,120,96,0.72)",
    contourStroke: "rgba(255,244,226,0.72)",
    playheadGlow: "rgba(255,224,196,0.18)",
    playheadCore: "rgba(255,250,242,0.96)",
    markerWarnGlow: "rgba(255,196,108,0.18)",
    markerErrorGlow: "rgba(255,102,122,0.18)",
    markerWarnBeam: "rgba(255,196,92,0.86)",
    markerErrorBeam: "rgba(255,92,122,0.9)",
  };
}
