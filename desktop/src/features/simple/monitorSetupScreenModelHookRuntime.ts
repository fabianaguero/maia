import type { AppTranslations } from "../../i18n/types";
import type { AppSkin } from "./appSkin";
import type { MonitorDeckControls, MonitorDeckPresetId } from "./monitorDeckControls";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { UseMonitorSetupProfileInput } from "./monitorSetupProfileHookRuntime";
import type { MonitorSetupProfile } from "./monitorSetupProfileRuntime";
import type { MonitorSetupScreenViewModel } from "./monitorSetupViewModel";

export interface UseMonitorSetupScreenModelInput {
  lang: "en" | "es";
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}

export function buildMonitorSetupScreenProfileInput(
  input: UseMonitorSetupScreenModelInput,
): UseMonitorSetupProfileInput {
  return input;
}

export function buildMonitorSetupScreenModelInput(input: {
  t: AppTranslations;
  viewModel: MonitorSetupScreenViewModel;
}) {
  return {
    t: input.t,
    viewModel: input.viewModel,
  };
}

export function buildMonitorSetupScreenHookResult<TScreenModel>(input: {
  profile: MonitorSetupProfile;
  viewModel: MonitorSetupScreenViewModel;
  screenModel: TScreenModel;
  updateDeckControl: <K extends keyof MonitorDeckControls>(
    controlId: K,
    value: MonitorDeckControls[K],
  ) => void;
  resetDeckControls: () => void;
  applyDeckPreset: (presetId: MonitorDeckPresetId) => void;
}) {
  return input;
}
