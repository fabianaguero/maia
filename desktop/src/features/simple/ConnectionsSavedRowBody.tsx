import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";
import { resolveConnectionsSavedRowStatusChipClass } from "./connectionsSavedRowRuntime";

interface ConnectionsSavedRowBodyProps {
  row: ConnectionsSavedListRowViewModel;
}

export function ConnectionsSavedRowBody({ row }: ConnectionsSavedRowBodyProps) {
  return (
    <div className="connections-saved-row__body">
      <div className="connections-saved-row__top">
        <strong className="connections-saved-row__title">{row.label}</strong>
        <div className="connections-saved-row__chips">
          <span className="connections-saved-row__chip connections-saved-row__chip--kind">
            {row.kindLabel}
          </span>
          <span
            className={`connections-saved-row__chip ${row.enabledTone === "enabled" ? "connections-saved-row__chip--enabled" : "connections-saved-row__chip--disabled"}`}
          >
            {row.enabledLabel}
          </span>
        </div>
      </div>

      <div className="connections-saved-row__meta">
        {row.metaChips.map((chip) => (
          <span
            key={chip.key}
            className={`connections-saved-row__meta-chip${
              chip.tone === "live" ? " connections-saved-row__meta-chip--live" : ""
            }`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {row.testLabel ? (
        <div className="connections-saved-row__probe">
          <span className={resolveConnectionsSavedRowStatusChipClass(row)}>{row.testLabel}</span>
          {row.testMessage ? (
            <span className="connections-saved-row__probe-text">{row.testMessage}</span>
          ) : null}
        </div>
      ) : null}

      <span className="connections-saved-row__uri" title={row.sourceUri}>
        {row.sourceUri}
      </span>
    </div>
  );
}
