import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { buildMonitorSetupProfile } from "./monitorSetupProfileRuntime";
import { buildMonitorSetupScreenViewModel } from "./monitorSetupViewModel";
import {
  buildMonitorSetupDeckControlsHookInput,
  buildMonitorSetupProfileHookResult,
  buildMonitorSetupProfileViewModelInput,
  type UseMonitorSetupProfileInput,
} from "./monitorSetupProfileHookRuntime";

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
  } = useMonitorDeckControls(buildMonitorSetupDeckControlsHookInput({ skin }));

  const profile = buildMonitorSetupProfile({
    deckControls,
    setupPreferences,
    activePreset,
    isDirty,
  });

  const viewModel = buildMonitorSetupScreenViewModel(
    buildMonitorSetupProfileViewModelInput({
      profile,
      lang,
      skin,
      t,
    }),
  );

  return buildMonitorSetupProfileHookResult({
    profile,
    viewModel,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
  });
}
