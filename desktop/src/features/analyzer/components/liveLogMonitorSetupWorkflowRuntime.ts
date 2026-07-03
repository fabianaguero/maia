import type { ComponentProps } from "react";

import { type LiveLogMonitorWorkflowStrip } from "./LiveLogMonitorWorkflowStrip";
import type { LiveLogMonitorSetupSectionInput } from "./liveLogMonitorSetupSectionTypes";

export function buildLiveLogMonitorSetupWorkflowStripProps(
  input: Pick<LiveLogMonitorSetupSectionInput, "t" | "hasBaseListeningBed" | "adapterConfigured">,
): ComponentProps<typeof LiveLogMonitorWorkflowStrip> {
  return {
    steps: [
      { label: input.t.inspect.baseBedStep, active: input.hasBaseListeningBed },
      { label: input.t.inspect.sourceFeedStep, active: input.adapterConfigured },
      { label: input.t.inspect.sceneStep, active: true },
      { label: input.t.inspect.runStep },
    ],
  };
}
