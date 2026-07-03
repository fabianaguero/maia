import { useEffect } from "react";

import {
  applyAppV0SkinPreference,
  persistAppV0Language,
  persistAppV0SetupPreferences,
  persistAppV0Skin,
  type AppV0Language,
} from "../appV0Preferences";
import type { MonitorSetupPreferences } from "../features/simple/monitorSetupPreferences";
import type { AppSkin } from "../features/simple/appSkin";
import { resolveAppV0PreferencesPersistenceTarget } from "./appV0PreferencesPersistenceRuntime";

interface UseAppV0PreferencesPersistenceInput {
  lang: AppV0Language;
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
}

export function useAppV0PreferencesPersistence({
  lang,
  skin,
  setupPreferences,
}: UseAppV0PreferencesPersistenceInput) {
  const persistenceTarget = resolveAppV0PreferencesPersistenceTarget(
    typeof window === "undefined" ? undefined : window,
    typeof document === "undefined" ? undefined : document,
  );

  useEffect(() => {
    persistAppV0Language(persistenceTarget.storage, lang);
  }, [lang, persistenceTarget.storage]);

  useEffect(() => {
    persistAppV0Skin(persistenceTarget.storage, skin);
    applyAppV0SkinPreference(persistenceTarget.rootElement, skin);
  }, [skin, persistenceTarget.rootElement, persistenceTarget.storage]);

  useEffect(() => {
    persistAppV0SetupPreferences(persistenceTarget.storage, setupPreferences);
  }, [persistenceTarget.storage, setupPreferences]);
}
