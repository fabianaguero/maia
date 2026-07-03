import { createContext, useContext } from "react";
import { en } from "./en";
import type { AppTranslations } from "./types";

export const I18nContext = createContext<AppTranslations>(en);

export function useT(): AppTranslations {
  return useContext(I18nContext);
}
