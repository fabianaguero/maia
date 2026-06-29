import type { MonitorDeckControls, MonitorDeckPresetId } from "./monitorDeckControls";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";

export interface MonitorSetupProfile {
  deckControls: MonitorDeckControls;
  setupPreferences: MonitorSetupPreferences;
  activePreset: MonitorDeckPresetId | "custom";
  isDirty: boolean;
}

export function buildMonitorSetupProfile(input: {
  deckControls: MonitorDeckControls;
  setupPreferences: MonitorSetupPreferences;
  activePreset: MonitorDeckPresetId | "custom";
  isDirty: boolean;
}): MonitorSetupProfile {
  return {
    deckControls: input.deckControls,
    setupPreferences: input.setupPreferences,
    activePreset: input.activePreset,
    isDirty: input.isDirty,
  };
}
