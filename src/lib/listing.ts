// Client-safe listing types and helpers (no Supabase access here).
import type { Dictionary } from "@/i18n/dictionaries/es";
import type { Money } from "./money";

export const PROPERTY_TYPES = ["hotel", "apartment", "house_villa", "hostel", "ecolodge", "cabin", "boutique_hotel", "glamping"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const AMENITIES = ["wifi", "breakfast", "pool", "parking", "air_conditioning", "heating", "kitchen", "pets", "spa", "restaurant", "airport_transfer", "view", "garden", "bbq"] as const;
export type Amenity = (typeof AMENITIES)[number];

export type ProductType = "accommodation" | "tour" | "package";
export type PricingUnit = "per_stay" | "per_night" | "per_person";
export type OfferKind = "normal" | "flash";

export type Extra = { id: string; name: string; price: Money };
export type ListingImage = { url: string; alt: string };

export type Listing = {
  offerId: string;
  productId: string;
  slug: string;
  type: ProductType;
  kind: OfferKind;
  featured: boolean;
  title: string;
  description: string;
  durationLabel: string | null;
  includes: string[];
  propertyType: PropertyType | null;
  pricingUnit: PricingUnit;
  capacityMax: number | null;
  minNights: number;
  maxNights: number | null;
  amenities: Amenity[];
  extras: Extra[];
  bookingConditions: string;
  cancellationPolicy: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  stayFrom: string | null;
  stayTo: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  verificationSummary: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleMapsUrl: string | null;
  original: Money;
  promo: Money;
  startsAt: string | null;
  endsAt: string | null;
  maxUnits: number | null;
  remainingUnits: number | null;
  destination: { name: string; slug: string } | null;
  images: ListingImage[];
  /** True when the content (title/description) is shown in Spanish as a fallback. */
  untranslated: boolean;
  /** Demo listing used to fill the catalog: labeled on the site and never bookable. */
  isSample: boolean;
};

export type Destination = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
};

export type ListingState = "upcoming" | "active" | "ended" | "sold_out";

export function listingState(listing: Pick<Listing, "startsAt" | "endsAt" | "remainingUnits">, now = Date.now()): ListingState {
  if (listing.endsAt && Date.parse(listing.endsAt) <= now) return "ended";
  if (listing.remainingUnits === 0) return "sold_out";
  if (listing.startsAt && Date.parse(listing.startsAt) > now) return "upcoming";
  return "active";
}

export function priceUnitLabel(unit: PricingUnit, dict: Dictionary): string {
  if (unit === "per_night") return dict.common.perNight;
  if (unit === "per_person") return dict.common.perPerson;
  return dict.common.perStay;
}

/** Flash offers show a countdown only when they really have an end date. */
export function hasCountdown(listing: Pick<Listing, "kind" | "endsAt">): boolean {
  return listing.kind === "flash" && Boolean(listing.endsAt);
}
