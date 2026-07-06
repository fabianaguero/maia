import { useAppSelectionEntityActions } from "./useAppSelectionEntityActions";
import { useAppSelectionMonitorActions } from "./useAppSelectionMonitorActions";
import {
  buildAppSelectionActionsResult,
  buildAppSelectionEntityActionsInput,
  buildAppSelectionMonitorActionsInput,
} from "./appSelectionActionsRuntime";
import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

export function useAppSelectionActions(input: UseAppSelectionActionsInput) {
  const entityActions = useAppSelectionEntityActions(buildAppSelectionEntityActionsInput(input));
  const monitorActions = useAppSelectionMonitorActions(buildAppSelectionMonitorActionsInput(input));

  return buildAppSelectionActionsResult({
    entityActions,
    monitorActions,
  });
}
