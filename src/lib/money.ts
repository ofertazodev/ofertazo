import { intlLocale, type Locale } from "@/i18n/config";

export type CurrencyCode = string;

/** Money in minor units (centavos). Never use floats for amounts. */
export type Money = { amount: bigint; currency: CurrencyCode };

export function money(amountMinor: number | string | bigint, currency: CurrencyCode): Money {
  return { amount: BigInt(amountMinor), currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} / ${b.currency}`);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function multiplyMoney(value: Money, factor: number): Money {
  if (!Number.isInteger(factor)) throw new Error("Money can only be multiplied by integers");
  return { amount: value.amount * BigInt(factor), currency: value.currency };
}

/** Display only. Amounts are converted to a number just to format them. */
export function formatMoney(value: Money, locale: Locale): string {
  const hasCents = value.amount % BigInt(100) !== BigInt(0);
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: value.currency,
    currencyDisplay: value.currency === "BOB" ? "narrowSymbol" : "symbol",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0
  }).format(Number(value.amount) / 100);
}

/** Whole-number discount percentage between the regular and the promotional price. */
export function discountPercent(original: Money, promotional: Money): number {
  if (original.amount <= BigInt(0)) return 0;
  return Number(((original.amount - promotional.amount) * BigInt(100)) / original.amount);
}

export function savings(original: Money, promotional: Money): Money {
  return { amount: original.amount - promotional.amount, currency: original.currency };
}
