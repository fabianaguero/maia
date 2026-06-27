import type { ComponentProps } from "react";

import { LiveLogMonitorBasePlaylistPanel } from "./LiveLogMonitorBasePlaylistPanel";
import { LiveLogMonitorLaunchPanel } from "./LiveLogMonitorLaunchPanel";
import { LiveLogMonitorWorkflowStrip } from "./LiveLogMonitorWorkflowStrip";

interface LiveLogMonitorSetupDeckProps {
  visible: boolean;
  workflowStripProps: ComponentProps<typeof LiveLogMonitorWorkflowStrip>;
  basePlaylistPanelProps: ComponentProps<typeof LiveLogMonitorBasePlaylistPanel>;
  launchPanelProps: ComponentProps<typeof LiveLogMonitorLaunchPanel>;
}

export function LiveLogMonitorSetupDeck({
  visible,
  workflowStripProps,
  basePlaylistPanelProps,
  launchPanelProps,
}: LiveLogMonitorSetupDeckProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      <LiveLogMonitorWorkflowStrip {...workflowStripProps} />
      <div className="monitor-setup-grid">
        <LiveLogMonitorBasePlaylistPanel {...basePlaylistPanelProps} />
        <LiveLogMonitorLaunchPanel {...launchPanelProps} />
      </div>
    </>
  );
}
