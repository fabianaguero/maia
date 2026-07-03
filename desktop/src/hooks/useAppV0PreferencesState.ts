import { useState, type Dispatch, type SetStateAction } from "react";

import { type AppV0Language } from "../appV0Preferences";
import {
  DEFAULT_MONITOR_SETUP_PREFERENCES,
  type MonitorSetupPreferences,
} from "../features/simple/monitorSetupPreferences";
import type { AppSkin } from "../features/simple/appSkin";
import { applyAppV0SetupPreferenceUpdate } from "./appV0PreferencesStateRuntime";
import { useAppV0PreferencesHydration } from "./useAppV0PreferencesHydration";
import { useAppV0PreferencesPersistence } from "./useAppV0PreferencesPersistence";

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

  useAppV0PreferencesHydration({
    setLang,
    setSkin,
    setSetupPreferences,
  });

  useAppV0PreferencesPersistence({
    lang,
    skin,
    setupPreferences,
  });

  const updateSetupPreference = <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => {
    setSetupPreferences((current) => applyAppV0SetupPreferenceUpdate(current, key, value));
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
