import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback } from "react";

import {
  resolveAppOpenConnectionsState,
  resolveAppPillarNavigationState,
} from "../appContentRuntime";
import type { AppPillar } from "../types/library";

interface UseAppContentNavigationActionsInput {
  userMode: "simple" | "expert";
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  t: {
    appShell: {
      monitoringBackgroundTitle: string;
      monitoringBackgroundBody: string;
    };
  };
  setPillar: (pillar: AppPillar) => void;
  setScreen: (screen: "library" | "inspect" | "compose" | "session") => void;
  setLibraryTab: (tab: "tracks" | "sources" | "connections" | "bases") => void;
}

export function useAppContentNavigationActions({
  userMode,
  notify,
  t,
  setPillar,
  setScreen,
  setLibraryTab,
}: UseAppContentNavigationActionsInput) {
  const handleOpenConnections = useCallback(() => {
    const nextState = resolveAppOpenConnectionsState();
    setPillar(nextState.pillar);
    setScreen(nextState.screen);
    setLibraryTab(nextState.libraryTab);
  }, [setLibraryTab, setPillar, setScreen]);

  const handlePillarChange = useCallback(
    (nextPillar: AppPillar) => {
      const nextState = resolveAppPillarNavigationState(userMode, nextPillar);
      setPillar(nextState.pillar);
      setScreen(nextState.screen);
    },
    [setPillar, setScreen, userMode],
  );

  const handleHideToBackground = useCallback(async () => {
    if (!isTauri()) {
      return;
    }

    void invoke("hide_window").catch(() => {});
    notify("info", t.appShell.monitoringBackgroundTitle, t.appShell.monitoringBackgroundBody);
  }, [notify, t]);

  return {
    handleOpenConnections,
    handlePillarChange,
    handleHideToBackground,
  };
}
