import { NextResponse, type NextRequest } from "next/server";
import { getListings } from "@/lib/catalog";
import { defaultLocale, isLocale } from "@/i18n/config";

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("locale") ?? undefined;
  const locale = isLocale(requested) ? requested : defaultLocale;
  const listings = await getListings(locale);
  // Money is bigint internally; JSON gets minor units as strings to avoid precision loss.
  const data = listings.map((listing) => ({
    ...listing,
    original: { amount: listing.original.amount.toString(), currency: listing.original.currency },
    promo: { amount: listing.promo.amount.toString(), currency: listing.promo.currency },
    extras: listing.extras.map((extra) => ({ ...extra, price: { amount: extra.price.amount.toString(), currency: extra.price.currency } }))
  }));
  return NextResponse.json({ data, source: "supabase" });
}
