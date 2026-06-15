import "server-only";

export const LOCALES = ["ko", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

const dictionaries = {
  ko: () => import("./dictionaries/ko").then((m) => m.default),
  ja: () => import("./dictionaries/ja").then((m) => m.default),
} as const;

export const hasLocale = (l: string): l is Locale =>
  (LOCALES as readonly string[]).includes(l);

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ko"]>>;
