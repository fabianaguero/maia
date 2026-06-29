import {
  sanitizeMonitorSetupPreferenceValue,
  type MonitorSetupPreferenceFieldViewModel,
  type MonitorSetupPreferenceGroupViewModel,
  type MonitorSetupPreferenceKey,
  type MonitorSetupPreferences,
} from "./monitorSetupPreferences";

export function resolveMonitorSetupRuntimeDefaultGroups(input: {
  runtimeDefaultFields: MonitorSetupPreferenceFieldViewModel[];
  runtimeDefaultGroups?: MonitorSetupPreferenceGroupViewModel[];
}): MonitorSetupPreferenceGroupViewModel[] {
  return (
    input.runtimeDefaultGroups ?? [
      {
        key: "stream-runtime",
        label: "",
        hint: "",
        fields: input.runtimeDefaultFields,
      },
    ]
  );
}

export function coerceMonitorSetupPreferenceInputValue<K extends MonitorSetupPreferenceKey>(
  key: K,
  inputMode: MonitorSetupPreferenceFieldViewModel["inputMode"],
  rawValue: string,
): MonitorSetupPreferences[K] {
  const candidate = inputMode === "number" ? Number(rawValue) : rawValue;
  return sanitizeMonitorSetupPreferenceValue(key, candidate);
}
