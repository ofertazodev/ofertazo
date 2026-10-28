// Server-side catalog queries. Only published data is readable (RLS), so these are safe with the anon key.
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { AMENITIES, PROPERTY_TYPES, type Amenity, type Destination, type Extra, type ItineraryDay, type Listing, type NearbyPlace, type PricingUnit, type ProductType, type PropertyType, type RoomOption } from "./listing";
import { money } from "./money";
import { getServerSupabase } from "./supabase-server";

type TranslatedFields = Partial<Record<"title" | "description" | "booking_conditions" | "cancellation_policy" | "name" | "duration_label", string>> & { includes?: string[] };
type Translations = Partial<Record<Locale, TranslatedFields>>;

type OfferRow = {
  id: string;
  kind: "normal" | "flash";
  title: string;
  original_price_minor: number;
  promotional_price_minor: number;
  currency_code: string;
  starts_at: string | null;
  ends_at: string | null;
  max_units: number | null;
  featured: boolean;
  product: {
    id: string;
    slug: string;
    type: ProductType;
    title: string;
    description: string;
    duration_label: string | null;
    includes: string[] | null;
    property_type: string | null;
    pricing_unit: PricingUnit;
    capacity_max: number | null;
    min_nights: number;
    max_nights: number | null;
    amenities: string[] | null;
    extras: { id?: string; name?: string; price_minor?: number }[] | null;
    booking_conditions: string;
    cancellation_policy: string;
    check_in_time: string | null;
    check_out_time: string | null;
    stay_available_from: string | null;
    stay_available_to: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    verified_at: string | null;
    verification_summary: string | null;
    google_rating: number | null;
    google_review_count: number | null;
    google_maps_url: string | null;
    // Optional until the 20261028 migration is applied everywhere.
    excludes?: string[] | null;
    restrictions?: string[] | null;
    perks?: string[] | null;
    tripadvisor_rating?: number | null;
    tripadvisor_review_count?: number | null;
    tripadvisor_url?: string | null;
    location_note?: string | null;
    nearby_places?: unknown;
    room_options?: unknown;
    itinerary?: unknown;
    translations: Translations | null;
    destination: { name: string; slug: string; translations: Translations | null } | null;
    product_media: { public_url: string | null; alt_text: string; sort_order: number }[] | null;
    is_sample?: boolean;
  };
};

// products(*) instead of a column list so optional columns (e.g. is_sample) never break the query
// if the app is deployed before their migration.
const OFFER_SELECT = `id,kind,title,original_price_minor,promotional_price_minor,currency_code,starts_at,ends_at,max_units,featured,
product:products!inner(*,destination:destinations(name,slug,translations),product_media(public_url,alt_text,sort_order))`;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const strings = (value: unknown) => (Array.isArray(value) ? value.map(str).filter((item): item is string => item !== null) : []);

// The JSON columns are edited in the admin panel; anything malformed is skipped instead of breaking the page.
function parseNearby(value: unknown): NearbyPlace[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((item) => {
    const name = str(item.name);
    const minutes = num(item.minutes);
    return name && minutes !== null ? [{ name, minutes, mode: item.mode === "walk" ? "walk" as const : "car" as const }] : [];
  });
}

function parseRooms(value: unknown, currency: string): RoomOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((item) => {
    const id = str(item.id);
    const name = str(item.name);
    const supplement = num(item.supplement_minor) ?? 0;
    if (!id || !name || !Number.isInteger(supplement)) return [];
    return [{ id, name, description: str(item.description) ?? "", imageUrl: str(item.image_url), features: strings(item.features), beds: str(item.beds), sizeM2: num(item.size_m2), maxGuests: num(item.max_guests), supplement: money(Math.max(supplement, 0), currency) }];
  });
}

function parseItinerary(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((item, index) => {
    const title = str(item.title);
    if (!title) return [];
    const stops = (Array.isArray(item.stops) ? item.stops : []).filter(isRecord).flatMap((stop) => {
      const name = str(stop.name);
      const lat = num(stop.lat);
      const lng = num(stop.lng);
      return name && lat !== null && lng !== null ? [{ name, lat, lng }] : [];
    });
    return [{ day: num(item.day) ?? index + 1, title, description: str(item.description) ?? "", overnight: str(item.overnight), stops }];
  });
}

function toListing(row: OfferRow, remaining: Map<string, number>, locale: Locale): Listing {
  const p = row.product;
  const tr = locale === "es" ? undefined : p.translations?.[locale];
  const currency = row.currency_code;
  const extras: Extra[] = (p.extras ?? [])
    .filter((extra): extra is { id: string; name: string; price_minor: number } => Boolean(extra.id && extra.name && Number.isInteger(extra.price_minor)))
    .map((extra) => ({ id: extra.id, name: extra.name, price: money(extra.price_minor, currency) }));
  const images = [...(p.product_media ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((media): media is { public_url: string; alt_text: string; sort_order: number } => Boolean(media.public_url))
    .map((media) => ({ url: media.public_url, alt: media.alt_text || p.title }));

  return {
    offerId: row.id,
    productId: p.id,
    slug: p.slug,
    type: p.type,
    kind: row.kind,
    featured: row.featured,
    title: tr?.title || p.title,
    description: tr?.description || p.description,
    durationLabel: tr?.duration_label || p.duration_label,
    includes: tr?.includes?.length ? tr.includes : p.includes ?? [],
    excludes: strings(p.excludes),
    restrictions: strings(p.restrictions),
    perks: strings(p.perks),
    propertyType: PROPERTY_TYPES.includes(p.property_type as PropertyType) ? (p.property_type as PropertyType) : null,
    pricingUnit: p.pricing_unit,
    capacityMax: p.capacity_max,
    minNights: p.min_nights,
    maxNights: p.max_nights,
    amenities: (p.amenities ?? []).filter((item): item is Amenity => AMENITIES.includes(item as Amenity)),
    extras,
    bookingConditions: tr?.booking_conditions || p.booking_conditions,
    cancellationPolicy: tr?.cancellation_policy || p.cancellation_policy,
    checkInTime: p.check_in_time,
    checkOutTime: p.check_out_time,
    stayFrom: p.stay_available_from,
    stayTo: p.stay_available_to,
    address: p.address,
    latitude: p.latitude === null ? null : Number(p.latitude),
    longitude: p.longitude === null ? null : Number(p.longitude),
    verified: Boolean(p.verified_at),
    verificationSummary: p.verification_summary,
    googleRating: p.google_rating === null ? null : Number(p.google_rating),
    googleReviewCount: p.google_review_count,
    googleMapsUrl: p.google_maps_url,
    tripadvisorRating: p.tripadvisor_rating === null || p.tripadvisor_rating === undefined ? null : Number(p.tripadvisor_rating),
    tripadvisorReviewCount: p.tripadvisor_review_count ?? null,
    tripadvisorUrl: str(p.tripadvisor_url),
    locationNote: str(p.location_note),
    nearbyPlaces: parseNearby(p.nearby_places),
    rooms: parseRooms(p.room_options, currency),
    itinerary: parseItinerary(p.itinerary),
    original: money(row.original_price_minor, currency),
    promo: money(row.promotional_price_minor, currency),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxUnits: row.max_units,
    remainingUnits: row.max_units === null ? null : remaining.get(row.id) ?? row.max_units,
    destination: p.destination ? { name: p.destination.translations?.[locale]?.name || p.destination.name.trim(), slug: p.destination.slug } : null,
    images,
    untranslated: locale !== "es" && !tr?.title,
    isSample: Boolean(p.is_sample)
  };
}

async function loadRemaining(): Promise<Map<string, number>> {
  const supabase = getServerSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase.rpc("offer_remaining_units");
  if (error) {
    console.error("offer_remaining_units failed", error.message);
    return new Map();
  }
  return new Map(((data ?? []) as { offer_id: string; remaining: number }[]).map((row) => [row.offer_id, row.remaining]));
}

/** Published offers that have not ended yet, flash and featured first. */
export const getListings = cache(async (locale: Locale): Promise<Listing[]> => {
  const supabase = getServerSupabase();
  if (!supabase) return [];
  const [{ data, error }, remaining] = await Promise.all([
    supabase
      .from("offers")
      .select(OFFER_SELECT)
      .eq("is_published", true)
      .or(`ends_at.is.null,ends_at.gt."${new Date().toISOString()}"`)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false }),
    loadRemaining()
  ]);
  if (error) {
    console.error("getListings failed", error.message);
    return [];
  }
  return ((data ?? []) as unknown as OfferRow[]).map((row) => toListing(row, remaining, locale));
});

/** Offer page lookup. Includes ended offers so old social links show "this deal ended" instead of a 404. */
export const getListingBySlug = cache(async (slug: string, locale: Locale): Promise<Listing | null> => {
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const [{ data, error }, remaining] = await Promise.all([
    supabase
      .from("offers")
      .select(OFFER_SELECT)
      .eq("is_published", true)
      .eq("product.slug", slug)
      .order("created_at", { ascending: false }),
    loadRemaining()
  ]);
  if (error) {
    console.error("getListingBySlug failed", error.message);
    return null;
  }
  const listings = ((data ?? []) as unknown as OfferRow[]).map((row) => toListing(row, remaining, locale));
  const now = Date.now();
  return listings.find((listing) => !listing.endsAt || Date.parse(listing.endsAt) > now) ?? listings[0] ?? null;
});

export const getDestinations = cache(async (locale: Locale): Promise<Destination[]> => {
  const supabase = getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("destinations")
    .select("id,slug,name,description,image_url,translations")
    .eq("is_published", true)
    .eq("kind", "city")
    .not("slug", "like", "%-destination")
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("getDestinations failed", error.message);
    return [];
  }
  return ((data ?? []) as { id: string; slug: string; name: string; description: string | null; image_url: string | null; translations: Translations | null }[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.translations?.[locale]?.name || row.name,
    description: row.translations?.[locale]?.description || row.description || "",
    imageUrl: row.image_url
  }));
});

export async function getDestination(slug: string, locale: Locale): Promise<Destination | null> {
  const destinations = await getDestinations(locale);
  return destinations.find((destination) => destination.slug === slug) ?? null;
}
