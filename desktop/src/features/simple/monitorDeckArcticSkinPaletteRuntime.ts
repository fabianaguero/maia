import type { MonitorDeckPalette, MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";
import { resolvePresetGlowAlpha } from "./monitorDeckGlowAlphaRuntime";

export function buildMonitorDeckArcticSkinPalette(
  base: MonitorDeckPalette,
  preset: MonitorDeckVisualPreset,
  withAlpha: (color: string, alpha: number) => string,
): MonitorDeckPalette {
  return {
    ...base,
    backgroundTop: "rgba(8,20,31,0.98)",
    backgroundMid: "rgba(4,10,17,0.99)",
    backgroundBottom: "rgba(1,4,8,1)",
    separatorLine: "rgba(168,221,255,0.06)",
    trackGlow: withAlpha(
      "rgba(125,227,255,1)",
      resolvePresetGlowAlpha(preset, { passive: 0.1, balanced: 0.14, alert: 0.18 }),
    ),
    overviewBaseGlow: withAlpha(
      "rgba(125,227,255,1)",
      resolvePresetGlowAlpha(preset, { passive: 0.14, balanced: 0.2, alert: 0.24 }),
    ),
    phraseCool: "rgba(173,238,255,0.88)",
    trackTopCool: "rgba(228,247,255,0.92)",
    trackBottomCool: "rgba(109,202,255,0.54)",
    centerLine: "rgba(125,227,255,0.94)",
    logGlowBottom: "rgba(125,227,255,0.1)",
    logCool: "rgba(134,214,255,0.34)",
    contourStroke: "rgba(236,249,255,0.76)",
    playheadGlow: "rgba(188,235,255,0.2)",
    playheadCore: "rgba(244,252,255,0.96)",
    markerWarnGlow: "rgba(148,217,255,0.14)",
    markerErrorGlow: "rgba(255,124,158,0.18)",
    markerWarnBeam: "rgba(146,219,255,0.84)",
    markerErrorBeam: "rgba(255,104,136,0.9)",
  };
}
