import type { useNotify } from "../components/NotificationSystem";
import type { useAppCatalogActions } from "./useAppCatalogActions";
import type { useAppContentDomainState } from "./useAppContentDomainState";
import type { useAppContentNavigationActions } from "./useAppContentNavigationActions";
import type { useAppMonitorActions } from "./useAppMonitorActions";
import type { useAppSelectionActions } from "./useAppSelectionActions";

export type AppContentDomainState = ReturnType<typeof useAppContentDomainState>;

export interface AppContentActionBundles {
  notify: ReturnType<typeof useNotify>["notify"];
  monitorActions: ReturnType<typeof useAppMonitorActions>;
  catalogActions: ReturnType<typeof useAppCatalogActions>;
  selectionActions: ReturnType<typeof useAppSelectionActions>;
  navigationActions: ReturnType<typeof useAppContentNavigationActions>;
}

export interface AppContentControllerActionBundles extends Pick<
  AppContentActionBundles,
  "catalogActions" | "selectionActions" | "navigationActions"
> {
  monitorActions: Pick<
    AppContentActionBundles["monitorActions"],
    "startReplaySession" | "startLiveSession" | "openMonitoredRepo"
  >;
}
