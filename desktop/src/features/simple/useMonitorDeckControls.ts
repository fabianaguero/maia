import { useEffect, useState } from "react";

import {
  areMonitorDeckControlsEqual,
  DEFAULT_MONITOR_DECK_CONTROLS,
  loadMonitorDeckControls,
  MONITOR_DECK_PRESETS,
  MONITOR_DECK_CONTROLS_STORAGE_KEY,
  resolveActiveMonitorDeckPreset,
  sanitizeMonitorDeckControls,
  type MonitorDeckControls,
  type MonitorDeckPresetId,
} from "./monitorDeckControls";

export function useMonitorDeckControls() {
  const [deckControls, setDeckControls] = useState<MonitorDeckControls>(
    DEFAULT_MONITOR_DECK_CONTROLS,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem(MONITOR_DECK_CONTROLS_STORAGE_KEY);
    setDeckControls(loadMonitorDeckControls(saved));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(MONITOR_DECK_CONTROLS_STORAGE_KEY, JSON.stringify(deckControls));
  }, [deckControls]);

  const updateDeckControl = <K extends keyof MonitorDeckControls>(
    key: K,
    value: MonitorDeckControls[K],
  ) => {
    setDeckControls((current) =>
      sanitizeMonitorDeckControls({
        ...current,
        [key]: value,
      }),
    );
  };

  const applyDeckPreset = (presetId: MonitorDeckPresetId) => {
    setDeckControls(MONITOR_DECK_PRESETS[presetId]);
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
