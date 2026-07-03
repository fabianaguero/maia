import type { MonitorDeckPalette, MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";
import { MONITOR_DECK_ALERT_BASE_PALETTE } from "./monitorDeckAlertBasePaletteRuntime";
import { MONITOR_DECK_BALANCED_BASE_PALETTE } from "./monitorDeckBalancedBasePaletteRuntime";
import { MONITOR_DECK_PASSIVE_BASE_PALETTE } from "./monitorDeckPassiveBasePaletteRuntime";

export function buildMonitorDeckBasePalette(preset: MonitorDeckVisualPreset): MonitorDeckPalette {
  switch (preset) {
    case "passive":
      return MONITOR_DECK_PASSIVE_BASE_PALETTE;
    case "alert":
      return MONITOR_DECK_ALERT_BASE_PALETTE;
    case "balanced":
    default:
      return MONITOR_DECK_BALANCED_BASE_PALETTE;
  }
}
