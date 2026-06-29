import { useEffect, useState } from "react";

import {
  areMonitorDeckControlsEqual,
  DEFAULT_MONITOR_DECK_CONTROLS,
  resolveActiveMonitorDeckPreset,
  type MonitorDeckControls,
  type MonitorDeckPresetId,
} from "./monitorDeckControls";
import {
  applyMonitorDeckPreset,
  persistMonitorDeckControls,
  readMonitorDeckControls,
  updateMonitorDeckControls,
} from "./monitorDeckControlsRuntime";
import type { AppSkin } from "./appSkin";

interface UseMonitorDeckControlsInput {
  skin?: AppSkin;
}

interface MonitorDeckControlsState {
  skin: AppSkin;
  controls: MonitorDeckControls;
}

export function useMonitorDeckControls({ skin = "nightfall" }: UseMonitorDeckControlsInput) {
  const [deckState, setDeckState] = useState<MonitorDeckControlsState>({
    skin,
    controls: DEFAULT_MONITOR_DECK_CONTROLS,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setDeckState({
      skin,
      controls: readMonitorDeckControls(window.localStorage, skin),
    });
  }, [skin]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (deckState.skin !== skin) {
      return;
    }
    persistMonitorDeckControls(window.localStorage, {
      skin,
      deckControls: deckState.controls,
    });
  }, [deckState, skin]);

  const deckControls = deckState.skin === skin ? deckState.controls : DEFAULT_MONITOR_DECK_CONTROLS;

  const updateDeckControl = <K extends keyof MonitorDeckControls>(
    key: K,
    value: MonitorDeckControls[K],
  ) => {
    setDeckState((current) => ({
      ...current,
      controls: updateMonitorDeckControls({ current: current.controls, key, value }),
    }));
  };

  const applyDeckPreset = (presetId: MonitorDeckPresetId) => {
    setDeckState((current) => ({
      ...current,
      controls: applyMonitorDeckPreset(presetId),
    }));
  };

  const activePreset = resolveActiveMonitorDeckPreset(deckControls);
  const isDirty = !areMonitorDeckControlsEqual(deckControls, DEFAULT_MONITOR_DECK_CONTROLS);

  return {
    deckControls,
    setDeckControls: (controls: MonitorDeckControls) =>
      setDeckState((current) => ({ ...current, controls })),
    updateDeckControl,
    applyDeckPreset,
    activePreset,
    isDirty,
    resetDeckControls: () =>
      setDeckState((current) => ({ ...current, controls: DEFAULT_MONITOR_DECK_CONTROLS })),
  };
}
