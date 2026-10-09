// Client-safe helpers (no dictionaries imported here, so they don't end up in client bundles).
import type { Locale } from "./config";

/** Fills {placeholders} in a dictionary string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Picks the singular or plural variant of a dictionary string. */
export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : fmt(many, { n: count });
}

/** Builds a locale-prefixed path: href("es", "/ofertas") -> "/es/ofertas". */
export function href(locale: Locale, path = "/"): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
