import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import {
  applyAppV0SkinPreference,
  loadAppV0Preferences,
  persistAppV0Language,
  persistAppV0SetupPreferences,
  persistAppV0Skin,
  type AppV0Language,
} from "../appV0Preferences";
import {
  DEFAULT_MONITOR_SETUP_PREFERENCES,
  sanitizeMonitorSetupPreferenceValue,
  type MonitorSetupPreferences,
} from "../features/simple/monitorSetupPreferences";
import type { AppSkin } from "../features/simple/appSkin";

export interface UseAppV0PreferencesStateResult {
  lang: AppV0Language;
  setLang: Dispatch<SetStateAction<AppV0Language>>;
  skin: AppSkin;
  setSkin: Dispatch<SetStateAction<AppSkin>>;
  setupPreferences: MonitorSetupPreferences;
  setSetupPreferences: Dispatch<SetStateAction<MonitorSetupPreferences>>;
  updateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}

export function useAppV0PreferencesState(): UseAppV0PreferencesStateResult {
  const [lang, setLang] = useState<AppV0Language>("es");
  const [skin, setSkin] = useState<AppSkin>("nightfall");
  const [setupPreferences, setSetupPreferences] = useState<MonitorSetupPreferences>(
    DEFAULT_MONITOR_SETUP_PREFERENCES,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const nextPreferences = loadAppV0Preferences(window.localStorage);
    setLang(nextPreferences.lang);
    setSkin(nextPreferences.skin);
    setSetupPreferences(nextPreferences.setupPreferences);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    persistAppV0Language(window.localStorage, lang);
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    persistAppV0Skin(window.localStorage, skin);
    applyAppV0SkinPreference(document.documentElement, skin);
  }, [skin]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    persistAppV0SetupPreferences(window.localStorage, setupPreferences);
  }, [setupPreferences]);

  const updateSetupPreference = <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => {
    setSetupPreferences(
      (current) =>
        ({
          ...current,
          [key]: sanitizeMonitorSetupPreferenceValue(key, value),
        }) as MonitorSetupPreferences,
    );
  };

  return {
    lang,
    setLang,
    skin,
    setSkin,
    setupPreferences,
    setSetupPreferences,
    updateSetupPreference,
  };
}
