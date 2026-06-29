import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { buildMonitorSetupProfile } from "./monitorSetupProfileRuntime";
import { buildMonitorSetupScreenViewModel } from "./monitorSetupViewModel";
import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";

interface UseMonitorSetupProfileInput {
  lang: "en" | "es";
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}

export function useMonitorSetupProfile({
  lang,
  skin,
  setupPreferences,
  t,
}: UseMonitorSetupProfileInput) {
  const {
    deckControls,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
    activePreset,
    isDirty,
  } = useMonitorDeckControls({ skin });

  const profile = buildMonitorSetupProfile({
    deckControls,
    setupPreferences,
    activePreset,
    isDirty,
  });

  const viewModel = buildMonitorSetupScreenViewModel({
    controls: profile.deckControls,
    lang,
    skin,
    activePreset: profile.activePreset,
    isDirty: profile.isDirty,
    setupPreferences: profile.setupPreferences,
    t,
  });

  return {
    profile,
    viewModel,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
  };
}
