import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, BadgeCheck, Car, MessageCircle, CalendarDays, Check, ChevronRight, Clock, ExternalLink, Footprints, Gift, Home, MapPin, Moon, Navigation, Plus, Star, Users, X } from "lucide-react";
import { BookingQuickForm } from "@/components/offers/BookingQuickForm";
import { Countdown } from "@/components/offers/Countdown";
import { Gallery } from "@/components/offers/Gallery";
import { StateNote } from "@/components/offers/OfferCard";
import { OfferMapLazy, RouteMapLazy } from "@/components/offers/OfferMapLazy";
import { TrackView } from "@/components/offers/TrackView";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { fmt, href, locales, plural, resolveLocale, type Dictionary } from "@/i18n";
import { getListingBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { hasCountdown, listingState, priceUnitLabel, type Listing } from "@/lib/listing";
import { discountPercent, formatMoney, savings } from "@/lib/money";
import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/whatsapp";

export const revalidate = 60;

// Pages are generated on first visit and cached for 60 s (ISR).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  const listing = await getListingBySlug(slug, locale);
  if (!listing) return {};
  const description = `${formatMoney(listing.promo, locale)} · -${discountPercent(listing.original, listing.promo)}% · ${listing.description}`.slice(0, 160);
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/${locale}/ofertas/${slug}`, languages: Object.fromEntries(locales.map((item) => [item, `/${item}/ofertas/${slug}`])) },
    openGraph: { title: listing.title, description, images: listing.images.slice(0, 1).map((image) => ({ url: image.url, alt: image.alt })), type: "website" }
  };
}

function availabilityText(listing: Listing, locale: Locale, dict: Dictionary): string {
  const from = listing.stayFrom ? formatDate(listing.stayFrom, locale, { day: "numeric", month: "long", year: "numeric" }) : null;
  const to = listing.stayTo ? formatDate(listing.stayTo, locale, { day: "numeric", month: "long", year: "numeric" }) : null;
  if (from && to) return fmt(dict.offer.availableBetween, { from, to });
  if (from) return fmt(dict.offer.availableFrom, { from });
  if (to) return fmt(dict.offer.availableTo, { to });
  return dict.offer.availableOnRequest;
}

/** "4,5 / 5 · 800 comentarios" in a square, as copied from the TripAdvisor listing by the admin. */
function TripadvisorScore({ listing, locale, dict }: { listing: Listing; locale: Locale; dict: Dictionary }) {
  const rating = listing.tripadvisorRating ?? 0;
  const content = (
    <>
      <span className="score-value">{rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<small>/ 5</small></span>
      <span className="score-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <i key={n} className={rating >= n - 0.25 ? "full" : rating >= n - 0.75 ? "half" : ""} />)}</span>
      {listing.tripadvisorReviewCount !== null && <span className="score-count">{fmt(dict.offer.tripadvisorReviews, { count: listing.tripadvisorReviewCount.toLocaleString(locale) })}</span>}
      <span className="score-source">{dict.offer.tripadvisor}</span>
    </>
  );
  return listing.tripadvisorUrl
    ? <a className="score-square" href={listing.tripadvisorUrl} target="_blank" rel="noreferrer">{content}</a>
    : <div className="score-square">{content}</div>;
}

export default async function OfferPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const listing = await getListingBySlug(slug, locale);
  if (!listing) notFound();

  const t = dict.offer;
  const state = listingState(listing);
  const bookable = state === "active";
  const pct = discountPercent(listing.original, listing.promo);
  const saved = formatMoney(savings(listing.original, listing.promo), locale);
  const offerUrl = `${siteUrl}/${locale}/ofertas/${slug}`;
  const questionMessage = fmt(dict.whatsapp.questionMessage, { title: listing.title, url: offerUrl });
  const unit = priceUnitLabel(listing.pricingUnit, dict);
  const mapsUrl = listing.googleMapsUrl ?? (listing.latitude !== null && listing.longitude !== null ? `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}` : null);

  const details = [
    listing.propertyType && { icon: Home, label: t.propertyType, value: dict.propertyTypes[listing.propertyType] },
    !listing.propertyType && { icon: Home, label: t.propertyType, value: dict.types[listing.type] },
    listing.capacityMax !== null && { icon: Users, label: t.capacity, value: fmt(t.capacityValue, { n: listing.capacityMax }) },
    listing.durationLabel && { icon: Moon, label: t.duration, value: listing.durationLabel },
    listing.minNights > 1 && { icon: Moon, label: t.minNights, value: plural(listing.minNights, dict.common.nightsOne, dict.common.nights) },
    listing.checkInTime && { icon: Clock, label: t.checkIn, value: listing.checkInTime },
    listing.checkOutTime && { icon: Clock, label: t.checkOut, value: listing.checkOutTime }
  ].filter((item): item is { icon: typeof Home; label: string; value: string } => Boolean(item));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images.map((image) => image.url),
    offers: { "@type": "Offer", price: (Number(listing.promo.amount) / 100).toFixed(2), priceCurrency: listing.promo.currency, url: offerUrl, availability: bookable ? "https://schema.org/InStock" : "https://schema.org/SoldOut", ...(listing.endsAt ? { priceValidUntil: listing.endsAt.slice(0, 10) } : {}) }
  };

  return (
    <article className="offer-page">
      <TrackView event="view_item" params={{ item_id: listing.slug, item_name: listing.title, item_category: listing.type, destination: listing.destination?.slug, value: Number(listing.promo.amount) / 100, currency: listing.promo.currency }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="shell">
        <nav className="breadcrumb" aria-label="breadcrumb">
          <Link href={href(locale, "/destinos")}>{dict.nav.destinations}</Link>
          {listing.destination && <><ChevronRight size={14} /><Link href={href(locale, `/destinos/${listing.destination.slug}`)}>{listing.destination.name}</Link></>}
        </nav>

        <header className="offer-header">
          <div className="offer-badges">
            <span className={`offer-discount ${listing.kind === "flash" ? "flash" : ""}`}>{listing.kind === "flash" && <small>{dict.common.flash}</small>}{fmt(dict.common.off, { pct })}</span>
            {listing.verified && <span className="badge-verified"><BadgeCheck size={15} /> {dict.common.verified}</span>}
          </div>
          <div className="offer-title-row">
            <h1>{listing.title}</h1>
            {listing.tripadvisorRating !== null && <TripadvisorScore listing={listing} locale={locale} dict={dict} />}
          </div>
          <p className="offer-subline">
            {listing.destination && <span><MapPin size={15} /> {listing.destination.name}</span>}
            {listing.googleRating !== null && (
              <span><Star size={15} fill="currentColor" /> {fmt(dict.common.googleRating, { rating: listing.googleRating.toLocaleString(locale) })}{listing.googleReviewCount ? ` ${fmt(dict.common.reviewsCount, { count: listing.googleReviewCount })}` : ""}</span>
            )}
          </p>
          {listing.untranslated && <p className="translation-note">{dict.common.translationPending}</p>}
        </header>

        <Gallery images={listing.images} title={listing.title} showAllLabel={fmt(t.showAllPhotos, { n: listing.images.length })} labels={{ previous: dict.home.slidePrev, next: dict.home.slideNext, close: dict.common.close }} />

        <div className="offer-layout">
          <div className="offer-body">
            <section>
              <h2>{listing.type === "accommodation" ? t.about : t.aboutOffer}</h2>
              <p className="prose">{listing.description}</p>
            </section>

            {listing.perks.length > 0 && (
              <section className="perks-box">
                <span className="perks-icon"><Gift size={26} /></span>
                <div>
                  <h2>{t.perks}</h2>
                  <p className="muted">{t.perksLead}</p>
                  <ul>{listing.perks.map((perk) => <li key={perk}><Check size={16} /> {perk}</li>)}</ul>
                </div>
              </section>
            )}

            {details.length > 0 && (
              <section>
                <h2>{t.details}</h2>
                <dl className="detail-grid">{details.map(({ icon: Icon, label, value }) => <div key={label}><Icon size={18} /><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              </section>
            )}

            {(listing.amenities.length > 0 || listing.includes.length > 0) && (
              <section>
                <h2>{listing.amenities.length > 0 ? t.included : t.includes}</h2>
                <ul className="check-list">
                  {listing.amenities.map((amenity) => <li key={amenity}><Check size={16} /> {dict.amenities[amenity]}</li>)}
                  {listing.includes.map((item) => <li key={item}><Check size={16} /> {item}</li>)}
                </ul>
              </section>
            )}

            {listing.excludes.length > 0 && (
              <section>
                <h2>{t.excludes}</h2>
                <ul className="check-list excluded">{listing.excludes.map((item) => <li key={item}><X size={16} /> {item}</li>)}</ul>
              </section>
            )}

            {listing.itinerary.length > 0 && (
              <section>
                <h2>{t.itinerary}</h2>
                <ol className="itinerary">
                  {listing.itinerary.map((day) => (
                    <li key={day.day}>
                      <span className="itinerary-day">{fmt(t.day, { n: day.day })}</span>
                      <div>
                        <h3>{day.title}</h3>
                        {day.description && <p>{day.description}</p>}
                        {day.stops.length > 0 && <p className="itinerary-stops"><Navigation size={14} /> {day.stops.map((stop) => stop.name).join(" → ")}</p>}
                        {day.overnight && <p className="itinerary-overnight"><Moon size={14} /> {fmt(t.overnight, { place: day.overnight })}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                {listing.itinerary.some((day) => day.stops.length > 0) && (
                  <>
                    <h3 className="route-title">{t.routeMap}</h3>
                    <RouteMapLazy days={listing.itinerary} />
                    <p className="fine-print">{t.routeNote}</p>
                  </>
                )}
              </section>
            )}

            {listing.extras.length > 0 && (
              <section>
                <h2>{t.extras}</h2>
                <p className="muted">{t.extrasHint}</p>
                <ul className="extras-table">{listing.extras.map((extra) => <li key={extra.id}><span><Plus size={15} /> {extra.name}</span><b>+ {formatMoney(extra.price, locale)}</b></li>)}</ul>
              </section>
            )}

            <section>
              <h2>{t.availability}</h2>
              <p className="availability-line"><CalendarDays size={18} /> {availabilityText(listing, locale, dict)}</p>
              <StateNote listing={listing} locale={locale} dict={dict} />
            </section>

            <section>
              <h2>{t.conditions}</h2>
              <p className="prose">{listing.bookingConditions || t.noConditions}</p>
              <h2>{t.cancellation}</h2>
              <p className="prose">{listing.cancellationPolicy || t.noConditions}</p>
            </section>

            {listing.restrictions.length > 0 && (
              <section>
                <h2>{t.restrictions}</h2>
                <ul className="check-list restrictions">{listing.restrictions.map((item) => <li key={item}><Ban size={16} /> {item}</li>)}</ul>
              </section>
            )}

            {(listing.latitude !== null && listing.longitude !== null) || listing.address ? (
              <section>
                <h2>{t.location}</h2>
                {listing.locationNote && <p className="location-note"><Navigation size={16} /> {listing.locationNote}</p>}
                {listing.address && <p className="muted"><MapPin size={15} /> {listing.address}</p>}
                {listing.latitude !== null && listing.longitude !== null && <OfferMapLazy latitude={listing.latitude} longitude={listing.longitude} />}
                {mapsUrl && <a className="map-link" href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> {t.openMaps} <ExternalLink size={14} /></a>}
                {listing.nearbyPlaces.length > 0 && (
                  <div className="nearby">
                    <h3>{t.nearby}</h3>
                    <ul>
                      {listing.nearbyPlaces.map((placeItem) => (
                        <li key={placeItem.name}>
                          <span>{placeItem.name}</span>
                          <b>{placeItem.mode === "walk" ? <Footprints size={15} /> : <Car size={15} />} {fmt(placeItem.mode === "walk" ? t.nearbyWalk : t.nearbyCar, { n: placeItem.minutes })}</b>
                        </li>
                      ))}
                    </ul>
                    <p className="fine-print">{t.nearbyNote}</p>
                  </div>
                )}
              </section>
            ) : null}

            {listing.verified && (
              <section className="verified-box">
                <BadgeCheck size={26} />
                <div>
                  <h3>{t.verifiedTitle}</h3>
                  <p>{listing.verificationSummary || t.verifiedText}</p>
                  <Link className="text-link" href={href(locale, "/verificacion")}>{t.verifiedLink} <ChevronRight size={15} /></Link>
                </div>
              </section>
            )}
          </div>

          <aside className="price-card" id="reservar">
            <div className="price-rows">
              <div><span>{t.regularPrice}</span><s>{formatMoney(listing.original, locale)}</s></div>
              <div className="price-main"><span>{t.exclusivePrice}</span><strong>{formatMoney(listing.promo, locale)}</strong><small>{unit}</small></div>
              <p className="savings-badge">{fmt(t.youSave, { amount: saved, pct })}</p>
            </div>
            {hasCountdown(listing) && state !== "ended" && listing.endsAt && <Countdown endsAt={listing.endsAt} common={dict.common} />}
            <StateNote listing={listing} locale={locale} dict={dict} />
            {bookable ? <BookingQuickForm listing={listing} locale={locale} dict={dict} /> : <p className="form-message">{t.notBookable}</p>}
            <p className="fine-print">{t.priceNote}</p>
            <div className="price-card-help">
              {bookable ? (
                <>
                  <p>{dict.whatsapp.offerCta}</p>
                  {/* Goes through the booking form so every sale becomes a TYA- booking the admin can confirm. */}
                  <Link className="whatsapp-button whatsapp-block" href={href(locale, `/reservar/${listing.slug}`)}><MessageCircle size={18} /><span>{dict.whatsapp.payButton}</span></Link>
                </>
              ) : (
                <WhatsAppButton placement="offer_price_card" message={questionMessage} label={dict.whatsapp.offerButton} variant="block" offerSlug={listing.slug} redirect={dict.whatsapp.redirect} />
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="sticky-book-bar">
        <div>
          <s>{formatMoney(listing.original, locale)}</s>
          <strong>{formatMoney(listing.promo, locale)}</strong> <small>{unit}</small>
        </div>
        {!bookable && <WhatsAppButton placement="offer_sticky_bar" message={questionMessage} label="WhatsApp" variant="inline" offerSlug={listing.slug} redirect={dict.whatsapp.redirect} />}
        {bookable && <BookingQuickForm listing={listing} locale={locale} dict={dict} compact />}
      </div>
    </article>
  );
}
