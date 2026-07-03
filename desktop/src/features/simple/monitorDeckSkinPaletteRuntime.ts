import type { AppSkin } from "./appSkin";
import type { MonitorDeckPalette, MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";
import { buildMonitorDeckArcticSkinPalette } from "./monitorDeckArcticSkinPaletteRuntime";
import { buildMonitorDeckCopperSkinPalette } from "./monitorDeckCopperSkinPaletteRuntime";

export function buildMonitorDeckSkinPalette(
  base: MonitorDeckPalette,
  skin: AppSkin,
  preset: MonitorDeckVisualPreset,
  withAlpha: (color: string, alpha: number) => string,
): MonitorDeckPalette {
  switch (skin) {
    case "arctic":
      return buildMonitorDeckArcticSkinPalette(base, preset, withAlpha);
    case "copper":
      return buildMonitorDeckCopperSkinPalette(base, preset, withAlpha);
    case "nightfall":
    default:
      return base;
  }
}
