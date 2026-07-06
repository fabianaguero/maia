import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorDeckControlKey } from "./monitorDeckControlPanelTypes";

export function coerceMonitorDeckControlValue<TKey extends MonitorDeckControlKey>(
  key: TKey,
  value: string,
): MonitorDeckControls[TKey] {
  if (key === "alertShape") {
    return value as MonitorDeckControls[TKey];
  }

  if (key === "beatSnapSubdivision" || key === "waveformScale" || key === "masterVolume") {
    return parseFloat(value) as MonitorDeckControls[TKey];
  }

  return parseInt(value, 10) as MonitorDeckControls[TKey];
}
