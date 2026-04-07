import { createContext, useContext } from "react";
import { en, type AppTranslations } from "./en";

export const I18nContext = createContext<AppTranslations>(en);

export function useT(): AppTranslations {
  return useContext(I18nContext);
}
