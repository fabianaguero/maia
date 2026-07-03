import { buildMonitorSetupScreenModel } from "./monitorSetupScreenRuntime";
import { useMonitorSetupProfile } from "./useMonitorSetupProfile";
import {
  buildMonitorSetupScreenHookResult,
  buildMonitorSetupScreenModelInput,
  buildMonitorSetupScreenProfileInput,
  type UseMonitorSetupScreenModelInput,
} from "./monitorSetupScreenModelHookRuntime";

export function useMonitorSetupScreenModel(input: UseMonitorSetupScreenModelInput) {
  const { profile, viewModel, updateDeckControl, resetDeckControls, applyDeckPreset } =
    useMonitorSetupProfile(buildMonitorSetupScreenProfileInput(input));
  const screenModel = buildMonitorSetupScreenModel(
    buildMonitorSetupScreenModelInput({
      t: input.t,
      viewModel,
    }),
  );

  return buildMonitorSetupScreenHookResult({
    profile,
    viewModel,
    screenModel,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
  });
}
