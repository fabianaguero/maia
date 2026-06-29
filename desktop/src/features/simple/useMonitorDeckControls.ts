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

export function useMonitorDeckControls() {
  const [deckControls, setDeckControls] = useState<MonitorDeckControls>(
    DEFAULT_MONITOR_DECK_CONTROLS,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setDeckControls(readMonitorDeckControls(window.localStorage));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    persistMonitorDeckControls(window.localStorage, deckControls);
  }, [deckControls]);

  const updateDeckControl = <K extends keyof MonitorDeckControls>(
    key: K,
    value: MonitorDeckControls[K],
  ) => {
    setDeckControls((current) => updateMonitorDeckControls({ current, key, value }));
  };

  const applyDeckPreset = (presetId: MonitorDeckPresetId) => {
    setDeckControls(applyMonitorDeckPreset(presetId));
  };

  const activePreset = resolveActiveMonitorDeckPreset(deckControls);
  const isDirty = !areMonitorDeckControlsEqual(deckControls, DEFAULT_MONITOR_DECK_CONTROLS);

  return {
    deckControls,
    setDeckControls,
    updateDeckControl,
    applyDeckPreset,
    activePreset,
    isDirty,
    resetDeckControls: () => setDeckControls(DEFAULT_MONITOR_DECK_CONTROLS),
  };
}
