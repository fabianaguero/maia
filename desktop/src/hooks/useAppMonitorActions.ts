import { useAppMonitorGuideActions } from "./useAppMonitorGuideActions";
import { useAppMonitorSessionActions } from "./useAppMonitorSessionActions";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export function useAppMonitorActions(input: UseAppMonitorActionsInput) {
  const guideActions = useAppMonitorGuideActions(input);
  const sessionActions = useAppMonitorSessionActions({
    ...input,
    armSessionMusicalBase: guideActions.armSessionMusicalBase,
    primeMonitorGuideTrack: guideActions.primeMonitorGuideTrack,
  });

  return {
    ...guideActions,
    ...sessionActions,
  };
}
