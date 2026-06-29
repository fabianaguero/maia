import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  loadMonitorDeckControlProfiles,
  loadMonitorDeckControls,
  MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
  MONITOR_DECK_CONTROLS_STORAGE_KEY,
  MONITOR_DECK_PRESETS,
  sanitizeMonitorDeckControls,
  sanitizeMonitorDeckControlProfiles,
  type MonitorDeckControls,
  type MonitorDeckControlProfiles,
  type MonitorDeckPresetId,
} from "./monitorDeckControls";
import type { AppSkin } from "./appSkin";

interface MonitorDeckControlsStorageReader {
  getItem(key: string): string | null;
}

interface MonitorDeckControlsStorageWriter {
  setItem(key: string, value: string): void;
}

export function readMonitorDeckControls(
  storage: MonitorDeckControlsStorageReader | null | undefined,
  skin: AppSkin = "nightfall",
): MonitorDeckControls {
  if (!storage) {
    return DEFAULT_MONITOR_DECK_CONTROLS;
  }

  const persistedProfiles = loadMonitorDeckControlProfiles(
    storage.getItem(MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY),
  );
  const skinProfile = persistedProfiles?.profiles[skin];
  if (skinProfile) {
    return skinProfile;
  }

  return loadMonitorDeckControls(storage.getItem(MONITOR_DECK_CONTROLS_STORAGE_KEY));
}

export function readMonitorDeckControlProfiles(
  storage: MonitorDeckControlsStorageReader | null | undefined,
): MonitorDeckControlProfiles {
  return (
    (storage &&
      loadMonitorDeckControlProfiles(storage.getItem(MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY))) ||
    sanitizeMonitorDeckControlProfiles(null)
  );
}

export function persistMonitorDeckControls(
  storage: (MonitorDeckControlsStorageReader & MonitorDeckControlsStorageWriter) | null | undefined,
  input: {
    skin: AppSkin;
    deckControls: MonitorDeckControls;
  },
): void {
  if (!storage) {
    return;
  }

  const currentProfiles = readMonitorDeckControlProfiles(storage);
  const nextProfiles = sanitizeMonitorDeckControlProfiles({
    ...currentProfiles,
    activeSkin: input.skin,
    profiles: {
      ...currentProfiles.profiles,
      [input.skin]: input.deckControls,
    },
  });

  storage.setItem(MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles));
  storage.setItem(MONITOR_DECK_CONTROLS_STORAGE_KEY, JSON.stringify(input.deckControls));
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
