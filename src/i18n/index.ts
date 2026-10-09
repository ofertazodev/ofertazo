// Server-side entry point. Client components import from "./format" and receive the dictionary as props.
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { es, type Dictionary } from "./dictionaries/es";
import { fr } from "./dictionaries/fr";

export type { Dictionary };
export * from "./config";
export * from "./format";

const dictionaries: Record<Locale, Dictionary> = { es, en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Validates the [locale] route segment; unknown locales are a 404. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<{ locale: Locale; dict: Dictionary }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: dictionaries[locale] };
}
