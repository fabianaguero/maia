import { useNotify } from "../components/NotificationSystem";
import { useAppCatalogActions } from "../hooks/useAppCatalogActions";
import { useAppContentNavigationActions } from "../hooks/useAppContentNavigationActions";
import { useAppMonitorActions } from "../hooks/useAppMonitorActions";
import { useAppSelectionActions } from "../hooks/useAppSelectionActions";
import {
  buildAppContentActionBundlesResult,
  buildAppContentCatalogActionsInput,
  buildAppContentMonitorActionsInput,
  buildAppContentNavigationActionsInput,
  buildAppContentSelectionActionsInput,
} from "./appContentActionBundlesRuntime";
import type { AppContentActionBundles, AppContentDomainState } from "./appContentControllerTypes";

export function useAppContentActionBundles(input: AppContentDomainState): AppContentActionBundles {
  const { notify } = useNotify();
  const monitorActions = useAppMonitorActions(buildAppContentMonitorActionsInput(input, notify));
  const catalogActions = useAppCatalogActions(buildAppContentCatalogActionsInput(input, notify));
  const selectionActions = useAppSelectionActions(
    buildAppContentSelectionActionsInput(input, monitorActions),
  );
  const navigationActions = useAppContentNavigationActions(
    buildAppContentNavigationActionsInput(input, notify),
  );

  return buildAppContentActionBundlesResult({
    notify,
    monitorActions,
    catalogActions,
    selectionActions,
    navigationActions,
  });
}
