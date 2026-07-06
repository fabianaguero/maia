import { useT } from "../../i18n/I18nContext";
import { SessionBoothDetailGrid } from "./SessionBoothDetailGrid";
import { SessionBoothHeader } from "./SessionBoothHeader";
import { SessionBoothProgress } from "./SessionBoothProgress";
import { SessionBoothRouteGrid } from "./SessionBoothRouteGrid";
import { SessionBoothStatsGrid } from "./SessionBoothStatsGrid";
import { buildSessionBoothPanelSections } from "./sessionBoothPanelRuntime";
import type { SessionBoothPanelProps } from "./sessionBoothPanelTypes";

export function SessionBoothPanel({ ...props }: SessionBoothPanelProps) {
  const t = useT();
  const { headerProps, progressProps, routeProps, detailProps, stats } =
    buildSessionBoothPanelSections({
      ...props,
      t,
    });

  return (
    <section className="panel session-booth-panel">
      <SessionBoothHeader {...headerProps} />

      <SessionBoothProgress {...progressProps} />

      <div className="session-booth-grid">
        <SessionBoothRouteGrid {...routeProps} />

        <SessionBoothStatsGrid stats={stats} />
      </div>

      <SessionBoothDetailGrid {...detailProps} />
    </section>
  );
}
