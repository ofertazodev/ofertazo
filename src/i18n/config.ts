export const locales = ["es", "en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = { es: "Español", en: "English", fr: "Français" };
export const intlLocale: Record<Locale, string> = { es: "es-BO", en: "en-US", fr: "fr-FR" };

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
