import { isAppSkin, type AppSkin } from "./appSkin";
import {
  buildMonitorDeckBasePalette,
  buildMonitorDeckSkinPalette,
} from "./monitorDeckCanvasPaletteRuntime";

export type MonitorDeckVisualPreset = "passive" | "balanced" | "alert";

export interface MonitorDeckPalette {
  backgroundTop: string;
  backgroundMid: string;
  backgroundBottom: string;
  separatorLine: string;
  trackGlow: string;
  overviewBaseGlow: string;
  overviewFillStops: string[];
  phraseCool: string;
  phraseMid: string;
  phraseWarm: string;
  phraseHot: string;
  trackTopCool: string;
  trackBottomCool: string;
  trackTopMid: string;
  trackBottomMid: string;
  trackTopWarm: string;
  trackBottomWarm: string;
  trackTopHot: string;
  trackBottomHot: string;
  centerLine: string;
  logGlowTop: string;
  logGlowMid: string;
  logGlowBottom: string;
  logCool: string;
  logWarm: string;
  logHot: string;
  anomalyWarn: string;
  anomalyWarnSoft: string;
  anomalyError: string;
  anomalyErrorSoft: string;
  burstWarn: string;
  burstError: string;
  contourStroke: string;
  playheadGlow: string;
  playheadCore: string;
  markerWarnGlow: string;
  markerErrorGlow: string;
  markerWarnBeam: string;
  markerErrorBeam: string;
}

export function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return color;
  }
  const parts = match[1]!.split(",").map((part) => part.trim());
  return `rgba(${parts[0] ?? "255"},${parts[1] ?? "255"},${parts[2] ?? "255"},${alpha})`;
}

export function resolveCurrentMonitorDeckSkin(): AppSkin {
  if (typeof document === "undefined") {
    return "nightfall";
  }
  const skin = document.documentElement.getAttribute("data-skin");
  return isAppSkin(skin) ? skin : "nightfall";
}

export function resolveMonitorDeckPalette(
  preset: MonitorDeckVisualPreset,
  skin: AppSkin = "nightfall",
): MonitorDeckPalette {
  const base = buildMonitorDeckBasePalette(preset);
  return buildMonitorDeckSkinPalette(base, skin, preset, withAlpha);
}
