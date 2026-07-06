import { useT } from "../../i18n/I18nContext";
import { SessionSavedSessionCardActions } from "./SessionSavedSessionCardActions";
import { SessionSavedSessionCardHeader } from "./SessionSavedSessionCardHeader";
import { SessionSavedSessionCardMetrics } from "./SessionSavedSessionCardMetrics";
import { buildSessionSavedSessionCardSections } from "./sessionSavedSessionCardRuntime";
import type { SessionSavedSessionCardProps } from "./sessionSavedSessionCardTypes";

export function SessionSavedSessionCard({ ...props }: SessionSavedSessionCardProps) {
  const t = useT();
  const sections = buildSessionSavedSessionCardSections({
    ...props,
    t,
  });

  return (
    <div
      className={`session-card${props.selected ? " selected" : ""}${props.active ? " active" : ""}`}
    >
      <SessionSavedSessionCardHeader {...sections.headerProps} />

      <SessionSavedSessionCardMetrics {...sections.metricsProps} />

      <p className="session-card-date">{sections.updatedAtLabel}</p>

      <SessionSavedSessionCardActions {...sections.actionsProps} />
    </div>
  );
}
