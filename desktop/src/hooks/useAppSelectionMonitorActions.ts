import { useCallback } from "react";

import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";

type MonitorActionsInput = Pick<
  UseAppSelectionActionsInput,
  "library" | "repositories" | "baseAssets" | "setPillar" | "setScreen"
>;

export function useAppSelectionMonitorActions({
  library,
  repositories,
  baseAssets,
  setPillar,
  setScreen,
}: MonitorActionsInput) {
  const goLibrary = useCallback(() => {
    setScreen("library");
  }, [setScreen]);

  const goCompose = useCallback(() => {
    setScreen("compose");
  }, [setScreen]);

  const startSimpleMonitoring = useCallback(
    (repoId: string, trackId?: string | null) => {
      const repositoryExists = repositories.repositories.some((entry) => entry.id === repoId);
      if (!repositoryExists) {
        return;
      }

      library.setSelectedTrackId(trackId ?? null);
      setPillar("perform");
      setScreen("session");
    },
    [library, repositories.repositories, setPillar, setScreen],
  );

  const startSimpleWizardSession = useCallback(
    (repoId: string, presetId: string) => {
      const repositoryExists = repositories.repositories.some((entry) => entry.id === repoId);
      const presetExists = baseAssets.baseAssets.some((entry) => entry.id === presetId);
      if (!repositoryExists || !presetExists) {
        return;
      }

      setPillar("perform");
      setScreen("session");
    },
    [baseAssets.baseAssets, repositories.repositories, setPillar, setScreen],
  );

  return {
    goLibrary,
    goCompose,
    startSimpleMonitoring,
    startSimpleWizardSession,
  };
}
