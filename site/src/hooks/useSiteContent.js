import { contentEn } from "../data/content.en";
import { contentEs } from "../data/content.es";
export function useSiteContent(lang) {
  return lang === "es" ? contentEs : contentEn;
}
