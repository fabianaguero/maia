import { buildMonitorSetupScreenModel } from "./monitorSetupScreenRuntime";
import { useMonitorSetupProfile } from "./useMonitorSetupProfile";
import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";

interface UseMonitorSetupScreenModelInput {
  lang: "en" | "es";
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}

export function useMonitorSetupScreenModel(input: UseMonitorSetupScreenModelInput) {
  const { profile, viewModel, updateDeckControl, resetDeckControls, applyDeckPreset } =
    useMonitorSetupProfile(input);
  const screenModel = buildMonitorSetupScreenModel({
    t: input.t,
    viewModel,
  });

  return {
    profile,
    viewModel,
    screenModel,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
  };
}
