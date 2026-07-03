import {
  buildAppMonitorActionsResult,
  buildAppMonitorSessionHookInput,
} from "./appMonitorActionsHookRuntime";
import { useAppMonitorGuideActions } from "./useAppMonitorGuideActions";
import { useAppMonitorSessionActions } from "./useAppMonitorSessionActions";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

export function useAppMonitorActions(input: UseAppMonitorActionsInput) {
  const guideActions = useAppMonitorGuideActions(input);
  const sessionActions = useAppMonitorSessionActions(
    buildAppMonitorSessionHookInput(input, guideActions),
  );

  return buildAppMonitorActionsResult({
    guideActions,
    sessionActions,
  });
}
