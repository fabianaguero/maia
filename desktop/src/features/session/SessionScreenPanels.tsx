import { SessionSavedSessionsPanel } from "./SessionSavedSessionsPanel";
import { SessionSetupPanel } from "./SessionSetupPanel";
import { buildSessionScreenPanelsSections } from "./sessionScreenPanelsViewRuntime";
import type { SessionScreenPanelsProps } from "./sessionScreenPanelsTypes";

export function SessionScreenPanels({ ...props }: SessionScreenPanelsProps) {
  const { setupPanelProps, savedSessionsPanelProps } = buildSessionScreenPanelsSections(props);

  return (
    <div className="session-layout">
      <SessionSetupPanel {...setupPanelProps} />

      <SessionSavedSessionsPanel {...savedSessionsPanelProps} />
    </div>
  );
}
