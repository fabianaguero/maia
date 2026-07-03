import type { en } from "./locales/enLocale";

type WidenTranslationLeaves<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly WidenTranslationLeaves<U>[]
        : T extends (infer U)[]
          ? WidenTranslationLeaves<U>[]
          : T extends object
            ? { [K in keyof T]: WidenTranslationLeaves<T[K]> }
            : T;

export type AppTranslations = WidenTranslationLeaves<typeof en>;
