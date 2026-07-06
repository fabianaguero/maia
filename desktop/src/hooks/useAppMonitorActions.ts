import {
  buildAppMonitorActionGroups,
  buildAppMonitorActionHookInputs,
  buildAppMonitorActionsResult,
} from "./appMonitorActionsHookRuntime";
import { useAppMonitorGuideActions } from "./useAppMonitorGuideActions";
import { useAppMonitorSessionActions } from "./useAppMonitorSessionActions";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export function useAppMonitorActions(input: UseAppMonitorActionsInput) {
  const guideActions = useAppMonitorGuideActions(input);
  const hookInputs = buildAppMonitorActionHookInputs(input, guideActions);
  const sessionActions = useAppMonitorSessionActions(hookInputs.sessionInput);
  const actionGroups = buildAppMonitorActionGroups({
    guideActions,
    sessionActions,
  });

  return buildAppMonitorActionsResult(actionGroups);
}
