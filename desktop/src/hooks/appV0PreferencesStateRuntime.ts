import {
  sanitizeMonitorSetupPreferenceValue,
  type MonitorSetupPreferences,
} from "../features/simple/monitorSetupPreferences";

export function applyAppV0SetupPreferenceUpdate<K extends keyof MonitorSetupPreferences>(
  current: MonitorSetupPreferences,
  key: K,
  value: MonitorSetupPreferences[K],
): MonitorSetupPreferences {
  return {
    ...current,
    [key]: sanitizeMonitorSetupPreferenceValue(key, value),
  } as MonitorSetupPreferences;
}
