import type { AppTranslations } from "../../i18n/en";

export interface MonitorSetupPreferences {
  defaultCloudLookback: string;
  idleHoldMs: number;
  tailWindowRows: number;
}

export type MonitorSetupPreferenceKey = keyof MonitorSetupPreferences;

export interface MonitorSetupPreferenceFieldViewModel {
  key: MonitorSetupPreferenceKey;
  group: MonitorSetupPreferenceGroupKey;
  label: string;
  help: string;
  valueLabel: string;
  inputMode: "text" | "number";
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export type MonitorSetupPreferenceGroupKey = "cloud-defaults" | "stream-runtime";

export interface MonitorSetupPreferenceGroupViewModel {
  key: MonitorSetupPreferenceGroupKey;
  label: string;
  hint: string;
  fields: MonitorSetupPreferenceFieldViewModel[];
}

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

export function formatMonitorSetupIdleHold(value: number): string {
  return `${Math.round(value / 100) / 10}s`;
}

export function formatMonitorSetupTailRows(value: number): string {
  return `${Math.round(value)} rows`;
}

export function buildMonitorSetupPreferenceFieldViewModels(input: {
  preferences: MonitorSetupPreferences;
  t: AppTranslations;
}): MonitorSetupPreferenceFieldViewModel[] {
  return [
    {
      key: "defaultCloudLookback",
      group: "cloud-defaults",
      label: input.t.simpleMode.deckSetup.cloudLookbackDefault,
      help: input.t.simpleMode.deckSetup.cloudLookbackDefaultHelp,
      valueLabel: input.preferences.defaultCloudLookback,
      inputMode: "text",
      placeholder: input.t.simpleMode.deckSetup.cloudLookbackDefaultPlaceholder,
    },
    {
      key: "idleHoldMs",
      group: "stream-runtime",
      label: input.t.simpleMode.deckSetup.idleHold,
      help: input.t.simpleMode.deckSetup.idleHoldHelp,
      valueLabel: formatMonitorSetupIdleHold(input.preferences.idleHoldMs),
      inputMode: "number",
      min: MONITOR_SETUP_PREFERENCE_LIMITS.idleHoldMs.min,
      max: MONITOR_SETUP_PREFERENCE_LIMITS.idleHoldMs.max,
      step: MONITOR_SETUP_PREFERENCE_LIMITS.idleHoldMs.step,
    },
    {
      key: "tailWindowRows",
      group: "stream-runtime",
      label: input.t.simpleMode.deckSetup.tailWindowRows,
      help: input.t.simpleMode.deckSetup.tailWindowRowsHelp,
      valueLabel: formatMonitorSetupTailRows(input.preferences.tailWindowRows),
      inputMode: "number",
      min: MONITOR_SETUP_PREFERENCE_LIMITS.tailWindowRows.min,
      max: MONITOR_SETUP_PREFERENCE_LIMITS.tailWindowRows.max,
      step: MONITOR_SETUP_PREFERENCE_LIMITS.tailWindowRows.step,
    },
  ];
}

export function buildMonitorSetupPreferenceGroups(input: {
  preferences: MonitorSetupPreferences;
  t: AppTranslations;
}): MonitorSetupPreferenceGroupViewModel[] {
  const fields = buildMonitorSetupPreferenceFieldViewModels(input);

  return [
    {
      key: "cloud-defaults" as const,
      label: input.t.simpleMode.deckSetup.runtimeGroupCloudTitle,
      hint: input.t.simpleMode.deckSetup.runtimeGroupCloudHint,
      fields: fields.filter((field) => field.group === "cloud-defaults"),
    },
    {
      key: "stream-runtime" as const,
      label: input.t.simpleMode.deckSetup.runtimeGroupStreamTitle,
      hint: input.t.simpleMode.deckSetup.runtimeGroupStreamHint,
      fields: fields.filter((field) => field.group === "stream-runtime"),
    },
  ].filter((group) => group.fields.length > 0);
}
