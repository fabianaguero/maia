import { useNotify } from "../components/NotificationSystem";
import { useAppCatalogActions } from "../hooks/useAppCatalogActions";
import { useAppContentNavigationActions } from "../hooks/useAppContentNavigationActions";
import { useAppMonitorActions } from "../hooks/useAppMonitorActions";
import { useAppSelectionActions } from "../hooks/useAppSelectionActions";
import {
  buildAppContentActionBundleInputs,
  buildAppContentActionBundlesResult,
  buildAppContentSelectionActionsInput,
} from "./appContentActionBundlesRuntime";
import type { AppContentActionBundles, AppContentDomainState } from "./appContentControllerTypes";

export function useAppContentActionBundles(input: AppContentDomainState): AppContentActionBundles {
  const { notify } = useNotify();
  const actionBundleInputs = buildAppContentActionBundleInputs(input, notify);
  const monitorActions = useAppMonitorActions(actionBundleInputs.monitorInput);
  const catalogActions = useAppCatalogActions(actionBundleInputs.catalogInput);
  const selectionActions = useAppSelectionActions(
    buildAppContentSelectionActionsInput(input, monitorActions),
  );
  const navigationActions = useAppContentNavigationActions(actionBundleInputs.navigationInput);

  return buildAppContentActionBundlesResult({
    notify,
    monitorActions,
    catalogActions,
    selectionActions,
    navigationActions,
  });
}
