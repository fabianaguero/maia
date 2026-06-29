import type { AppTranslations } from "../../i18n/en";
import {
  MONITOR_SETUP_PREFERENCE_LIMITS,
  type MonitorSetupPreferenceKey,
  type MonitorSetupPreferences,
} from "./monitorSetupPreferences";

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
