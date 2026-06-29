export interface MonitorSetupPreferences {
  defaultCloudLookback: string;
  idleHoldMs: number;
  tailWindowRows: number;
}

export type MonitorSetupPreferenceKey = keyof MonitorSetupPreferences;

export const MONITOR_SETUP_PREFERENCES_STORAGE_KEY = "maia.monitor-setup-preferences.v1";

export const DEFAULT_MONITOR_SETUP_PREFERENCES: MonitorSetupPreferences = {
  defaultCloudLookback: "10m",
  idleHoldMs: 900,
  tailWindowRows: 1200,
};

export const MONITOR_SETUP_PREFERENCE_LIMITS = {
  idleHoldMs: {
    min: 250,
    max: 10_000,
    step: 100,
  },
  tailWindowRows: {
    min: 200,
    max: 5_000,
    step: 100,
  },
} as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function sanitizeCloudLookback(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_MONITOR_SETUP_PREFERENCES.defaultCloudLookback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_MONITOR_SETUP_PREFERENCES.defaultCloudLookback;
}

export function sanitizeMonitorSetupPreferenceValue<K extends MonitorSetupPreferenceKey>(
  key: K,
  value: unknown,
): MonitorSetupPreferences[K] {
  switch (key) {
    case "defaultCloudLookback":
      return sanitizeCloudLookback(value) as MonitorSetupPreferences[K];
    case "idleHoldMs":
      return clamp(
        typeof value === "number" ? value : Number(value),
        MONITOR_SETUP_PREFERENCE_LIMITS.idleHoldMs.min,
        MONITOR_SETUP_PREFERENCE_LIMITS.idleHoldMs.max,
      ) as MonitorSetupPreferences[K];
    case "tailWindowRows":
      return clamp(
        typeof value === "number" ? value : Number(value),
        MONITOR_SETUP_PREFERENCE_LIMITS.tailWindowRows.min,
        MONITOR_SETUP_PREFERENCE_LIMITS.tailWindowRows.max,
      ) as MonitorSetupPreferences[K];
    default:
      return DEFAULT_MONITOR_SETUP_PREFERENCES[key];
  }
}

export function sanitizeMonitorSetupPreferences(
  value: Partial<MonitorSetupPreferences> | null | undefined,
): MonitorSetupPreferences {
  return {
    defaultCloudLookback: sanitizeMonitorSetupPreferenceValue(
      "defaultCloudLookback",
      value?.defaultCloudLookback,
    ),
    idleHoldMs: sanitizeMonitorSetupPreferenceValue("idleHoldMs", value?.idleHoldMs),
    tailWindowRows: sanitizeMonitorSetupPreferenceValue("tailWindowRows", value?.tailWindowRows),
  };
}

export function loadMonitorSetupPreferences(
  raw: string | null | undefined,
): MonitorSetupPreferences {
  if (!raw) {
    return DEFAULT_MONITOR_SETUP_PREFERENCES;
  }

  try {
    return sanitizeMonitorSetupPreferences(JSON.parse(raw) as Partial<MonitorSetupPreferences>);
  } catch {
    return DEFAULT_MONITOR_SETUP_PREFERENCES;
  }
}
