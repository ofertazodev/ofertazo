"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { hasCountdown, listingState, priceUnitLabel, type Listing } from "@/lib/listing";
import { discountPercent, formatMoney, savings } from "@/lib/money";
import { Countdown } from "./Countdown";
import { StateNote } from "./OfferCard";

type Props = { listing: Listing; locale: Locale; dict: Dictionary; listName: string };

const MAX_AMENITIES = 4;

/** Horizontal result card for search listings: photo | details | price. */
export function OfferRow({ listing, locale, dict, listName }: Props) {
  const pct = discountPercent(listing.original, listing.promo);
  const state = listingState(listing);
  const image = listing.images[0];
  const subtitle = listing.propertyType ? dict.propertyTypes[listing.propertyType] : dict.types[listing.type];
  const extraAmenities = listing.amenities.length - MAX_AMENITIES;

  return (
    <article className="offer-row">
      <Link href={href(locale, `/ofertas/${listing.slug}`)} className="offer-row-link" onClick={() => track("select_item", { item_id: listing.slug, item_list_name: listName })}>
        <div className="offer-row-image">
          {image ? <Image src={image.url} alt={image.alt} fill sizes="(max-width: 800px) 100vw, 300px" /> : <div className="image-placeholder" />}
          <span className={`pill ${listing.kind === "flash" ? "pill-flash" : ""}`}>{listing.kind === "flash" ? `${dict.common.flash} · ` : ""}{fmt(dict.common.off, { pct })}</span>
          {listing.isSample && <span className="pill pill-sample">{dict.common.sample}</span>}
        </div>
        <div className="offer-row-body">
          <p className="offer-row-type">{subtitle}</p>
          <h3>{listing.title}</h3>
          {listing.destination && <p className="offer-row-location"><MapPin size={14} /> {listing.destination.name}</p>}
          <div className="offer-row-badges">
            {listing.googleRating !== null && <span className="rating"><Star size={14} fill="currentColor" /> {fmt(dict.common.googleRating, { rating: listing.googleRating.toLocaleString(locale) })}</span>}
            {listing.verified && <span className="verified-line"><BadgeCheck size={15} /> {dict.common.verified}</span>}
          </div>
          {listing.amenities.length > 0 && (
            <ul className="offer-row-amenities">
              {listing.amenities.slice(0, MAX_AMENITIES).map((amenity) => <li key={amenity}>{dict.amenities[amenity]}</li>)}
              {extraAmenities > 0 && <li>+{extraAmenities}</li>}
            </ul>
          )}
          <StateNote listing={listing} locale={locale} dict={dict} />
          {hasCountdown(listing) && state === "active" && listing.endsAt && <Countdown endsAt={listing.endsAt} common={dict.common} compact />}
        </div>
        <div className="offer-row-price">
          <span className="offer-row-price-label">{dict.explorer.priceLabel} {priceUnitLabel(listing.pricingUnit, dict)}</span>
          <span className="old-price">{fmt(dict.common.before, { amount: formatMoney(listing.original, locale) })}</span>
          <strong>{formatMoney(listing.promo, locale)}</strong>
          <span className="savings">{fmt(dict.common.save, { amount: formatMoney(savings(listing.original, listing.promo), locale) })}</span>
          <span className="dark-button offer-row-cta">{dict.explorer.seeDetail}</span>
        </div>
      </Link>
    </article>
  );
}
