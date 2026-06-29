import type {
  MonitorSetupPreferenceFieldViewModel,
  MonitorSetupPreferenceGroupViewModel,
} from "./monitorSetupPreferenceViewModelRuntime";
import type { AppTranslations } from "../../i18n/en";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import {
  coerceMonitorSetupPreferenceInputValue,
  resolveMonitorSetupRuntimeDefaultGroups,
} from "./monitorSetupSectionsRuntime";

interface MonitorSetupRuntimeDefaultsBankProps {
  t: AppTranslations;
  setupPreferences: MonitorSetupPreferences;
  runtimeDefaultFields: MonitorSetupPreferenceFieldViewModel[];
  runtimeDefaultGroups?: MonitorSetupPreferenceGroupViewModel[];
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}

export function MonitorSetupRuntimeDefaultsBank({
  t,
  setupPreferences,
  runtimeDefaultFields,
  runtimeDefaultGroups,
  onUpdateSetupPreference,
}: MonitorSetupRuntimeDefaultsBankProps) {
  const runtimeGroups = resolveMonitorSetupRuntimeDefaultGroups({
    runtimeDefaultFields,
    runtimeDefaultGroups,
  });

  return (
    <div className="monitor-setup-screen__preset-bank">
      <div className="monitor-setup-screen__preset-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {t.simpleMode.deckSetup.runtimeDefaults}
        </span>
        <strong>{t.simpleMode.deckSetup.runtimeDefaultsTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={t.simpleMode.deckSetup.runtimeDefaultsDescription}
        >
          {t.simpleMode.deckSetup.runtimeDefaultsHint}
        </span>
      </div>

      <div className="monitor-control-rack__grid" role="group">
        {runtimeGroups.map((group) => (
          <div key={group.key} className="monitor-setup-screen__runtime-group">
            {group.label ? (
              <div className="monitor-setup-screen__runtime-group-copy">
                <strong>{group.label}</strong>
                <span className="monitor-setup-screen__microcopy">{group.hint}</span>
              </div>
            ) : null}
            <div
              className="monitor-control-rack__grid"
              role="group"
              aria-label={group.label || undefined}
            >
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className="monitor-control-field monitor-control-field--compact"
                >
                  <span className="monitor-control-field__label">{field.label}</span>
                  <div className="monitor-control-field__meta">
                    <span>{field.help}</span>
                    <strong>{field.valueLabel}</strong>
                  </div>
                  <input
                    type={field.inputMode}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(setupPreferences[field.key])}
                    onChange={(event) => {
                      onUpdateSetupPreference(
                        field.key,
                        coerceMonitorSetupPreferenceInputValue(
                          field.key,
                          field.inputMode,
                          event.target.value,
                        ),
                      );
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
