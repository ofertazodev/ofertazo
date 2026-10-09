import { intlLocale, type Locale } from "@/i18n/config";

/** Formats a calendar date ("2026-10-15") without timezone shifts. */
export function formatDate(isoDate: string, locale: Locale, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale[locale], { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Formats a timestamp in the destination timezone (Bolivia for now). */
export function formatDateTime(iso: string, locale: Locale, timeZone = "America/La_Paz"): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Today's date in Bolivia as YYYY-MM-DD. */
export function todayInBolivia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date());
}
