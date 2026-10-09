import type { ExplorerFilters } from "@/components/offers/OfferExplorer";
import { PROPERTY_TYPES, type ProductType, type PropertyType } from "./listing";

const PRODUCT_TYPES: ProductType[] = ["accommodation", "tour", "package"];

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const isoDate = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");

/** Maps shareable URL params (?q=tarija&in=2026-10-20&out=2026-10-22&g=2&flash=1&destino=tarija&tipo=hotel&categoria=tour) to explorer filters. */
export function explorerInitial(query: SearchParams): Partial<ExplorerFilters> {
  const tipo = one(query.tipo);
  const categoria = one(query.categoria);
  return {
    q: one(query.q).slice(0, 80),
    destination: one(query.destino),
    type: PRODUCT_TYPES.includes(categoria as ProductType) ? (categoria as ProductType) : "",
    propertyType: PROPERTY_TYPES.includes(tipo as PropertyType) ? (tipo as PropertyType) : "",
    checkIn: isoDate(one(query.in)),
    checkOut: isoDate(one(query.out)),
    guests: /^\d{1,2}$/.test(one(query.g)) ? one(query.g) : "",
    flashOnly: one(query.flash) === "1"
  };
}
