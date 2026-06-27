export const APP_SKINS = ["nightfall", "arctic", "copper"] as const;

export type AppSkin = (typeof APP_SKINS)[number];

export const APP_V0_SKIN_STORAGE_KEY = "maia.app-v0.skin";

export function isAppSkin(value: string | null | undefined): value is AppSkin {
  return typeof value === "string" && APP_SKINS.includes(value as AppSkin);
}
