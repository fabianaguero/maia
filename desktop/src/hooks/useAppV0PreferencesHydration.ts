import { useEffect, type Dispatch, type SetStateAction } from "react";

import { loadAppV0Preferences, type AppV0Language } from "../appV0Preferences";
import type { MonitorSetupPreferences } from "../features/simple/monitorSetupPreferences";
import type { AppSkin } from "../features/simple/appSkin";

interface UseAppV0PreferencesHydrationInput {
  setLang: Dispatch<SetStateAction<AppV0Language>>;
  setSkin: Dispatch<SetStateAction<AppSkin>>;
  setSetupPreferences: Dispatch<SetStateAction<MonitorSetupPreferences>>;
}

export function useAppV0PreferencesHydration({
  setLang,
  setSkin,
  setSetupPreferences,
}: UseAppV0PreferencesHydrationInput) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextPreferences = loadAppV0Preferences(window.localStorage);
    setLang(nextPreferences.lang);
    setSkin(nextPreferences.skin);
    setSetupPreferences(nextPreferences.setupPreferences);
  }, [setLang, setSetupPreferences, setSkin]);
}
