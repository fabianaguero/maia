import type { MonitorDeckVisualPreset } from "./monitorDeckCanvasPalette";

export function resolvePresetGlowAlpha(
  preset: MonitorDeckVisualPreset,
  values: { passive: number; balanced: number; alert: number },
): number {
  switch (preset) {
    case "passive":
      return values.passive;
    case "alert":
      return values.alert;
    case "balanced":
    default:
      return values.balanced;
  }
}
