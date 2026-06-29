import {
  DEFAULT_MONITOR_SETUP_PREFERENCES,
  loadMonitorSetupPreferences,
  MONITOR_SETUP_PREFERENCES_STORAGE_KEY,
  type MonitorSetupPreferences,
} from "./features/simple/monitorSetupPreferences";
import { APP_V0_SKIN_STORAGE_KEY, isAppSkin, type AppSkin } from "./features/simple/appSkin";

export type AppV0Language = "en" | "es";

export const APP_V0_LANG_STORAGE_KEY = "maia.app-v0.lang";

export interface AppV0PreferencesState {
  lang: AppV0Language;
  skin: AppSkin;
  setupPreferences: MonitorSetupPreferences;
}

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter {
  setItem(key: string, value: string): void;
}

interface RootElementLike {
  setAttribute(name: string, value: string): void;
}

export function isAppV0Language(value: string | null | undefined): value is AppV0Language {
  return value === "en" || value === "es";
}

export function loadAppV0Preferences(
  storage: StorageReader | null | undefined,
): AppV0PreferencesState {
  const lang = storage ? storage.getItem(APP_V0_LANG_STORAGE_KEY) : null;
  const skin = storage ? storage.getItem(APP_V0_SKIN_STORAGE_KEY) : null;
  const setupPreferences = storage
    ? loadMonitorSetupPreferences(storage.getItem(MONITOR_SETUP_PREFERENCES_STORAGE_KEY))
    : DEFAULT_MONITOR_SETUP_PREFERENCES;

  return {
    lang: isAppV0Language(lang) ? lang : "es",
    skin: isAppSkin(skin) ? skin : "nightfall",
    setupPreferences,
  };
}

export function persistAppV0Language(
  storage: StorageWriter | null | undefined,
  lang: AppV0Language,
): void {
  storage?.setItem(APP_V0_LANG_STORAGE_KEY, lang);
}

export function persistAppV0Skin(storage: StorageWriter | null | undefined, skin: AppSkin): void {
  storage?.setItem(APP_V0_SKIN_STORAGE_KEY, skin);
}

export function persistAppV0SetupPreferences(
  storage: StorageWriter | null | undefined,
  setupPreferences: MonitorSetupPreferences,
): void {
  storage?.setItem(MONITOR_SETUP_PREFERENCES_STORAGE_KEY, JSON.stringify(setupPreferences));
}

export function applyAppV0SkinPreference(
  rootElement: RootElementLike | null | undefined,
  skin: AppSkin,
): void {
  rootElement?.setAttribute("data-skin", skin);
}
