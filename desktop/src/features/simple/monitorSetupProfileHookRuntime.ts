import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { MonitorSetupProfile } from "./monitorSetupProfileRuntime";
import type { MonitorSetupScreenViewModel } from "./monitorSetupViewModel";
import type { MonitorDeckControls, MonitorDeckPresetId } from "./monitorDeckControls";

export interface UseMonitorSetupProfileInput {
  lang: "en" | "es";
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}

export function buildMonitorSetupDeckControlsHookInput(
  input: Pick<UseMonitorSetupProfileInput, "skin">,
) {
  return {
    skin: input.skin,
  };
}

export function buildMonitorSetupProfileViewModelInput(input: {
  profile: MonitorSetupProfile;
  lang: "en" | "es";
  skin: AppSkin;
  t: AppTranslations;
}) {
  return {
    controls: input.profile.deckControls,
    lang: input.lang,
    skin: input.skin,
    activePreset: input.profile.activePreset,
    isDirty: input.profile.isDirty,
    setupPreferences: input.profile.setupPreferences,
    t: input.t,
  };
}

export function buildMonitorSetupProfileHookResult(input: {
  profile: MonitorSetupProfile;
  viewModel: MonitorSetupScreenViewModel;
  updateDeckControl: <K extends keyof MonitorDeckControls>(
    controlId: K,
    value: MonitorDeckControls[K],
  ) => void;
  resetDeckControls: () => void;
  applyDeckPreset: (presetId: MonitorDeckPresetId) => void;
}) {
  return input;
}
