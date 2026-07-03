import React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { MonitorDeckControls } from "./monitorDeckControls";
import {
  buildMonitorDeckControlGroups,
  coerceMonitorDeckControlValue,
} from "./monitorDeckControlPanelRuntime";

interface MonitorDeckControlPanelProps {
  controls: MonitorDeckControls;
  onChange: <K extends keyof MonitorDeckControls>(key: K, value: MonitorDeckControls[K]) => void;
  onReset: () => void;
}

export function MonitorDeckControlPanel({
  controls,
  onChange,
  onReset,
}: MonitorDeckControlPanelProps) {
  const t = useT();
  const groups = buildMonitorDeckControlGroups({ controls, t });
  return (
    <div className="monitor-control-rack">
      <div className="monitor-control-rack__header">
        <div className="monitor-control-rack__title">
          <SlidersHorizontal size={14} />
          <span>{t.simpleMode.deckSetup.deckControls}</span>
        </div>
        <button type="button" className="monitor-control-rack__reset" onClick={onReset}>
          <RotateCcw size={12} />
          {t.simpleMode.deckSetup.reset}
        </button>
      </div>

      <div className="monitor-control-rack__clusters">
        {groups.map((group) => (
          <section key={group.key} className="monitor-control-cluster">
            <div className="monitor-control-cluster__header">
              <strong>{group.title}</strong>
              <p>{group.detail}</p>
            </div>
            <div className="monitor-control-rack__grid">
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className={`monitor-control-field${field.compact ? " monitor-control-field--compact" : ""}`}
                >
                  <span className="monitor-control-field__label">{field.label}</span>
                  <div className="monitor-control-field__meta">
                    <span>{field.help}</span>
                    <strong>{field.valueLabel}</strong>
                  </div>
                  {field.inputKind === "select" ? (
                    <select
                      aria-label={field.label}
                      value={String(controls[field.key])}
                      onChange={(event) =>
                        onChange(
                          field.key,
                          coerceMonitorDeckControlValue(field.key, event.target.value),
                        )
                      }
                    >
                      {field.options.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={field.label}
                      type={field.inputKind}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={String(controls[field.key])}
                      onChange={(event) =>
                        onChange(
                          field.key,
                          coerceMonitorDeckControlValue(field.key, event.target.value),
                        )
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
