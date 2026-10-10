"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href, plural } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { formatDate } from "@/lib/dates";
import { hasCountdown, listingState, priceUnitLabel, type Listing } from "@/lib/listing";
import { discountPercent, formatMoney, savings } from "@/lib/money";
import { Countdown } from "./Countdown";

type Props = { listing: Listing; locale: Locale; dict: Dictionary; listName: string };

export function OfferCard({ listing, locale, dict, listName }: Props) {
  const pct = discountPercent(listing.original, listing.promo);
  const state = listingState(listing);
  const image = listing.images[0];
  const subtitle = listing.propertyType ? dict.propertyTypes[listing.propertyType] : dict.types[listing.type];
  const link = href(locale, `/ofertas/${listing.slug}`);

  return (
    <article className="offer-card">
      <Link href={link} className="offer-card-link" onClick={() => track("select_item", { item_id: listing.slug, item_list_name: listName })}>
        <div className="offer-image">
          {image ? <Image src={image.url} alt={image.alt} fill sizes="(max-width: 800px) 100vw, 380px" /> : <div className="image-placeholder" />}
          <div className="offer-topline">
            <span className={`pill ${listing.kind === "flash" ? "pill-flash" : ""}`}>{listing.kind === "flash" ? `${dict.common.flash} · ` : ""}{fmt(dict.common.off, { pct })}</span>
            {listing.isSample ? <span className="pill pill-sample">{dict.common.sample}</span> : hasCountdown(listing) && state === "active" && listing.endsAt && <Countdown endsAt={listing.endsAt} common={dict.common} compact />}
          </div>
          {listing.destination && <span className="image-location"><MapPin size={14} /> {listing.destination.name}</span>}
        </div>
        <div className="offer-content">
          <div className="offer-meta">
            <span>{subtitle}</span>
            {listing.googleRating !== null && <span className="rating"><Star size={14} fill="currentColor" /> {fmt(dict.common.googleRating, { rating: listing.googleRating.toLocaleString(locale) })}</span>}
          </div>
          <h3>{listing.title}</h3>
          {listing.verified && <p className="verified-line"><BadgeCheck size={15} /> {dict.common.verified}</p>}
          <p className="offer-includes">{[listing.durationLabel, ...listing.includes].filter(Boolean).join(" · ")}</p>
          <StateNote listing={listing} locale={locale} dict={dict} />
          <div className="offer-bottom">
            <div>
              <span className="old-price">{fmt(dict.common.before, { amount: formatMoney(listing.original, locale) })}</span>
              <strong>{formatMoney(listing.promo, locale)}</strong><small> {priceUnitLabel(listing.pricingUnit, dict)}</small>
              <span className="savings">{fmt(dict.common.save, { amount: formatMoney(savings(listing.original, listing.promo), locale) })}</span>
            </div>
            <span className="arrow-button" aria-hidden="true"><ArrowRight size={18} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function StateNote({ listing, locale, dict }: { listing: Listing; locale: Locale; dict: Dictionary }) {
  const state = listingState(listing);
  if (state === "sold_out") return <p className="state-note danger">{dict.common.soldOut}</p>;
  if (state === "ended") return <p className="state-note danger">{dict.common.ended}</p>;
  if (state === "upcoming" && listing.startsAt) return <p className="state-note">{fmt(dict.common.startsOn, { date: formatDate(listing.startsAt, locale) })}</p>;
  if (listing.remainingUnits !== null && listing.remainingUnits <= 5) return <p className="state-note warm">{plural(listing.remainingUnits, dict.common.remainingOne, dict.common.remaining)}</p>;
  if (listing.endsAt && !hasCountdown(listing)) return <p className="state-note">{fmt(dict.common.validUntil, { date: formatDate(listing.endsAt, locale) })}</p>;
  return null;
}
