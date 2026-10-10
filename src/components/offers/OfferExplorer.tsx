"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plural } from "@/i18n/format";
import { AMENITIES, PROPERTY_TYPES, listingState, type Amenity, type Destination, type Listing, type ProductType, type PropertyType } from "@/lib/listing";
import { discountPercent } from "@/lib/money";
import { OfferRow } from "./OfferRow";
import { PRICE_MAX, PRICE_MIN, PriceRange } from "./PriceRange";

export type ExplorerFilters = {
  q: string;
  destination: string;
  type: ProductType | "";
  propertyType: PropertyType | "";
  /** Whole Bs; PRICE_MIN / PRICE_MAX mean "no limit" on that side. */
  minPrice: number;
  maxPrice: number;
  amenities: Amenity[];
  minRating: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  flashOnly: boolean;
};

export const emptyFilters: ExplorerFilters = { q: "", destination: "", type: "", propertyType: "", minPrice: PRICE_MIN, maxPrice: PRICE_MAX, amenities: [], minRating: "", checkIn: "", checkOut: "", guests: "", flashOnly: false };

type Sort = "recommended" | "price_asc" | "price_desc" | "discount" | "rating";
const SORTS: Sort[] = ["recommended", "price_asc", "price_desc", "discount", "rating"];

type Props = {
  mode: "offers" | "accommodations";
  listings: Listing[];
  destinations: Destination[];
  locale: Locale;
  dict: Dictionary;
  initial: Partial<ExplorerFilters>;
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const DAY_MS = 86_400_000;

/** Requested dates (ISO yyyy-mm-dd) fall inside the bookable window and respect min/max nights for stays. */
function fitsStay(listing: Listing, checkIn: string, checkOut: string) {
  const { stayFrom, stayTo } = listing;
  if (checkIn && ((stayFrom && checkIn < stayFrom) || (stayTo && checkIn >= stayTo))) return false;
  if (checkOut && ((stayTo && checkOut > stayTo) || (stayFrom && checkOut <= stayFrom))) return false;
  if (checkIn && checkOut && listing.type === "accommodation") {
    const nights = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS);
    if (nights < listing.minNights || (listing.maxNights !== null && nights > listing.maxNights)) return false;
  }
  return true;
}

const compareBigint = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0);

export function OfferExplorer({ mode, listings, destinations, locale, dict, initial }: Props) {
  const [filters, setFilters] = useState<ExplorerFilters>({ ...emptyFilters, ...initial });
  const [sort, setSort] = useState<Sort>("recommended");
  const [panelOpen, setPanelOpen] = useState(false);
  const t = dict.explorer;
  const set = <K extends keyof ExplorerFilters>(key: K, value: ExplorerFilters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleAmenity = (amenity: Amenity) => set("amenities", filters.amenities.includes(amenity) ? filters.amenities.filter((item) => item !== amenity) : [...filters.amenities, amenity]);

  // Listings this explorer can ever show; facet counts are computed over them.
  const base = useMemo(() => (mode === "accommodations" ? listings.filter((listing) => listing.type === "accommodation") : listings), [listings, mode]);

  const results = useMemo(() => {
    const query = normalize(filters.q.trim());
    const minMinor = filters.minPrice > PRICE_MIN ? BigInt(filters.minPrice) * BigInt(100) : null;
    const maxMinor = filters.maxPrice < PRICE_MAX ? BigInt(filters.maxPrice) * BigInt(100) : null;
    const guests = Number(filters.guests) || 0;
    const filtered = base.filter((listing) => {
      if (query && !normalize(`${listing.title} ${listing.destination?.name ?? ""}`).includes(query)) return false;
      if (filters.destination && listing.destination?.slug !== filters.destination) return false;
      if (filters.type && listing.type !== filters.type) return false;
      if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;
      if (minMinor !== null && listing.promo.amount < minMinor) return false;
      if (maxMinor !== null && listing.promo.amount > maxMinor) return false;
      if (filters.amenities.some((amenity) => !listing.amenities.includes(amenity))) return false;
      if (filters.minRating && (listing.googleRating ?? 0) < Number(filters.minRating)) return false;
      if (guests && listing.capacityMax !== null && guests > listing.capacityMax) return false;
      if (!fitsStay(listing, filters.checkIn, filters.checkOut)) return false;
      if (filters.flashOnly && listing.kind !== "flash") return false;
      return true;
    });
    const bySort: Record<Sort, (a: Listing, b: Listing) => number> = {
      recommended: (a, b) => Number(b.featured) - Number(a.featured),
      price_asc: (a, b) => compareBigint(a.promo.amount, b.promo.amount),
      price_desc: (a, b) => compareBigint(b.promo.amount, a.promo.amount),
      discount: (a, b) => discountPercent(b.original, b.promo) - discountPercent(a.original, a.promo),
      rating: (a, b) => (b.googleRating ?? 0) - (a.googleRating ?? 0)
    };
    // Bookable offers always first, sold out / upcoming last.
    return filtered.sort((a, b) => Number(listingState(a) !== "active") - Number(listingState(b) !== "active") || bySort[sort](a, b));
  }, [filters, base, sort]);

  const count = <T,>(pick: (listing: Listing) => T, value: T) => base.filter((listing) => pick(listing) === value).length;
  const activeCount = Object.entries(filters).filter(([key, value]) => (key === "minPrice" ? value !== PRICE_MIN : key === "maxPrice" ? value !== PRICE_MAX : Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
  const prices = base.map((listing) => Number(listing.promo.amount / BigInt(100)));
  const sortLabels: Record<Sort, string> = { recommended: t.sortRecommended, price_asc: t.sortPriceAsc, price_desc: t.sortPriceDesc, discount: t.sortDiscount, rating: t.sortRating };
  const typeOptions = mode === "offers"
    ? (["accommodation", "package", "tour"] as const).map((type) => ({ value: type, label: dict.types[type], n: count((listing) => listing.type, type) }))
    : PROPERTY_TYPES.map((type) => ({ value: type, label: dict.propertyTypeGroups[type], n: count((listing) => listing.propertyType, type) }));
  const typeValue = mode === "offers" ? filters.type : filters.propertyType;
  const setType = (value: string) => (mode === "offers" ? set("type", value as ProductType | "") : set("propertyType", value as PropertyType | ""));

  return (
    <div className={`explorer ${panelOpen ? "panel-open" : ""}`}>
      <aside className="explorer-panel">
        <div className="explorer-panel-head"><strong>{t.filters}</strong><button aria-label={dict.common.close} onClick={() => setPanelOpen(false)}><X size={18} /></button></div>

        <section className="filter-group">
          <h3>{t.searchByName}</h3>
          <label className="explorer-search"><Search size={16} /><input value={filters.q} onChange={(event) => set("q", event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchByName} /></label>
        </section>

        <section className="filter-group">
          <div className="explorer-row">
            <label>{t.checkIn}<input type="date" value={filters.checkIn} onChange={(event) => set("checkIn", event.target.value)} /></label>
            <label>{t.checkOut}<input type="date" value={filters.checkOut} min={filters.checkIn || undefined} onChange={(event) => set("checkOut", event.target.value)} /></label>
          </div>
          <label>{t.guests}<input type="number" min={1} max={50} value={filters.guests} onChange={(event) => set("guests", event.target.value)} /></label>
        </section>

        {destinations.length > 0 && (
          <section className="filter-group">
            <h3>{t.places}</h3>
            <select value={filters.destination} onChange={(event) => set("destination", event.target.value)} aria-label={t.places}>
              <option value="">{t.allPlaces} ({base.length})</option>
              {destinations.map((destination) => <option key={destination.slug} value={destination.slug}>{destination.name} ({count((listing) => listing.destination?.slug, destination.slug)})</option>)}
            </select>
          </section>
        )}

        <section className="filter-group">
          <h3>{mode === "offers" ? t.type : t.propertyType}</h3>
          <OptionList name="type" value={typeValue} onChange={setType} allLabel={mode === "offers" ? t.allTypes : t.allPropertyTypes} allCount={base.length} options={typeOptions} showEmpty />
        </section>

        <section className="filter-group">
          <h3>{t.priceTitle}</h3>
          <PriceRange prices={prices} min={filters.minPrice} max={filters.maxPrice} locale={locale}
            onChange={(min, max) => setFilters((current) => ({ ...current, minPrice: min, maxPrice: max }))}
            labels={{ title: t.priceTitle, min: t.priceMin, max: t.priceMax, hint: t.priceHint, hintOne: t.priceHintOne }} />
        </section>

        <section className="filter-group">
          <h3>{t.rating}</h3>
          <OptionList name="rating" value={filters.minRating} onChange={(value) => set("minRating", value)} allLabel={t.anyRating}
            options={["4", "4.5"].map((value) => ({ value, label: `${Number(value).toLocaleString(locale)}+`, n: base.filter((listing) => (listing.googleRating ?? 0) >= Number(value)).length }))} />
        </section>

        <section className="filter-group">
          <h3>{t.amenities}</h3>
          <ul className="option-list">
            {AMENITIES.map((amenity) => (
              <li key={amenity}>
                <label className="option"><input type="checkbox" checked={filters.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} /> <span>{dict.amenities[amenity]}</span> <small>{base.filter((listing) => listing.amenities.includes(amenity)).length}</small></label>
              </li>
            ))}
          </ul>
        </section>

        <section className="filter-group">
          <label className="option"><input type="checkbox" checked={filters.flashOnly} onChange={(event) => set("flashOnly", event.target.checked)} /> <span>{t.flashOnly}</span> <small>{count((listing) => listing.kind, "flash")}</small></label>
        </section>

        <button className="modal-secondary" onClick={() => setFilters(emptyFilters)}>{t.clear}</button>
      </aside>

      <div className="explorer-results">
        <div className="results-toolbar">
          <p className="results-count">{plural(results.length, t.resultsOne, t.results)}</p>
          <label className="sort-select">{t.sortBy}
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>{SORTS.map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}</select>
          </label>
          <button className="filter-toggle" onClick={() => setPanelOpen(true)} aria-expanded={panelOpen}><SlidersHorizontal size={17} /> {t.filters}{activeCount > 0 && <b>{activeCount}</b>}</button>
        </div>
        {results.length > 0
          ? <div className="offer-list">{results.map((listing) => <OfferRow key={listing.offerId} listing={listing} locale={locale} dict={dict} listName={mode} />)}</div>
          : <div className="empty-state"><Search size={22} /><p>{t.empty}</p><button className="dark-button" onClick={() => setFilters(emptyFilters)}>{t.clear}</button></div>}
      </div>
    </div>
  );
}

type Option = { value: string; label: string; n: number };

/** Single-choice filter shown as a radio list with result counts. */
function OptionList({ name, value, onChange, allLabel, allCount, options, showEmpty = false }: { name: string; value: string; onChange: (value: string) => void; allLabel: string; allCount?: number; options: Option[]; showEmpty?: boolean }) {
  return (
    <ul className="option-list">
      <li><label className="option"><input type="radio" name={name} checked={value === ""} onChange={() => onChange("")} /> <span>{allLabel}</span> {allCount !== undefined && <small>{allCount}</small>}</label></li>
      {options.filter((option) => showEmpty || option.n > 0 || option.value === value).map((option) => (
        <li key={option.value}><label className="option"><input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} /> <span>{option.label}</span> <small>{option.n}</small></label></li>
      ))}
    </ul>
  );
}
