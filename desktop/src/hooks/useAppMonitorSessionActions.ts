import { useMemo } from "react";

import { buildAppMonitorSessionActionRunners } from "./appMonitorSessionActionRunnerRuntime";
import {
  buildAppMonitorSessionActionInputs,
  type UseAppMonitorSessionActionsInput,
} from "./appMonitorSessionActionsHookRuntime";

export function useAppMonitorSessionActions({
  t,
  repositories,
  sessions,
  monitor,
  notify,
  setAnalysisMode,
  setScreen,
  setPillar,
  armSessionMusicalBase,
  primeMonitorGuideTrack,
}: UseAppMonitorSessionActionsInput) {
  const actionInputs = useMemo(
    () =>
      buildAppMonitorSessionActionInputs({
        t,
        repositories,
        sessions,
        monitor,
        notify,
        setAnalysisMode,
        setScreen,
        setPillar,
        armSessionMusicalBase,
        primeMonitorGuideTrack,
      }),
    [
      armSessionMusicalBase,
      monitor,
      notify,
      primeMonitorGuideTrack,
      repositories,
      sessions,
      setAnalysisMode,
      setPillar,
      setScreen,
      t,
    ],
  );

  return useMemo(
    () => buildAppMonitorSessionActionRunners(actionInputs),
    [actionInputs],
  );
}
