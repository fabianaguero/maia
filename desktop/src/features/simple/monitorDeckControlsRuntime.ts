import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  loadMonitorDeckControls,
  MONITOR_DECK_CONTROLS_STORAGE_KEY,
  MONITOR_DECK_PRESETS,
  sanitizeMonitorDeckControls,
  type MonitorDeckControls,
  type MonitorDeckPresetId,
} from "./monitorDeckControls";

interface MonitorDeckControlsStorageReader {
  getItem(key: string): string | null;
}

interface MonitorDeckControlsStorageWriter {
  setItem(key: string, value: string): void;
}

export function readMonitorDeckControls(
  storage: MonitorDeckControlsStorageReader | null | undefined,
): MonitorDeckControls {
  return storage
    ? loadMonitorDeckControls(storage.getItem(MONITOR_DECK_CONTROLS_STORAGE_KEY))
    : DEFAULT_MONITOR_DECK_CONTROLS;
}

export function persistMonitorDeckControls(
  storage: MonitorDeckControlsStorageWriter | null | undefined,
  deckControls: MonitorDeckControls,
): void {
  storage?.setItem(MONITOR_DECK_CONTROLS_STORAGE_KEY, JSON.stringify(deckControls));
}

export function updateMonitorDeckControls<K extends keyof MonitorDeckControls>(input: {
  current: MonitorDeckControls;
  key: K;
  value: MonitorDeckControls[K];
}): MonitorDeckControls {
  return sanitizeMonitorDeckControls({
    ...input.current,
    [input.key]: input.value,
  });
}

export function applyMonitorDeckPreset(presetId: MonitorDeckPresetId): MonitorDeckControls {
  return MONITOR_DECK_PRESETS[presetId];
}
