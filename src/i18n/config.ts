export const locales = ["es", "en", "fr", "pt", "de", "zh", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = { es: "Español", en: "English", fr: "Français", pt: "Português", de: "Deutsch", zh: "中文", ja: "日本語", ko: "한국어" };
export const intlLocale: Record<Locale, string> = { es: "es-BO", en: "en-US", fr: "fr-FR", pt: "pt-BR", de: "de-DE", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" };

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
