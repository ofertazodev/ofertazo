import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Compass } from "lucide-react";
import { OfferCard } from "@/components/offers/OfferCard";
import { TrackView } from "@/components/offers/TrackView";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { fmt, href, locales, resolveLocale } from "@/i18n";
import { getDestination, getListings } from "@/lib/catalog";
import { hasCountdown, type Listing } from "@/lib/listing";

export const revalidate = 60;

// Pages are generated on first visit and cached for 60 s (ISR).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  const destination = await getDestination(slug, locale);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.description,
    alternates: { languages: Object.fromEntries(locales.map((item) => [item, `/${item}/destinos/${slug}`])) }
  };
}

export default async function DestinationPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const [destination, listings] = await Promise.all([getDestination(slug, locale), getListings(locale)]);
  if (!destination) notFound();

  const t = dict.destinations;
  const here = listings.filter((listing) => listing.destination?.slug === slug);
  const cover = destination.imageUrl ?? here.find((listing) => listing.images[0])?.images[0].url ?? null;
  const groups: { id: string; title: string; items: Listing[] }[] = [
    { id: "flash", title: t.flash, items: here.filter(hasCountdown) },
    { id: "alojamientos", title: t.accommodations, items: here.filter((listing) => listing.type === "accommodation" && !hasCountdown(listing)) },
    { id: "escapadas", title: t.getaways, items: here.filter((listing) => listing.type === "package" && !hasCountdown(listing)) },
    { id: "experiencias", title: t.experiences, items: here.filter((listing) => listing.type === "tour" && !hasCountdown(listing)) }
  ].filter((group) => group.items.length > 0);

  return (
    <>
      <TrackView event="view_destination" params={{ destination: slug, offers: here.length }} />
      <section className="destination-hero" style={cover ? { backgroundImage: `linear-gradient(180deg,rgba(23,35,43,.15),rgba(23,35,43,.7)),url('${cover}')` } : undefined}>
        <div className="shell">
          <nav className="breadcrumb light" aria-label="breadcrumb"><Link href={href(locale, "/destinos")}>{dict.nav.destinations}</Link><ChevronRight size={14} /><span>{destination.name}</span></nav>
          <h1>{destination.name}</h1>
          <p>{destination.description}</p>
          {groups.length > 1 && <div className="anchor-row">{groups.map((group) => <a key={group.id} href={`#${group.id}`}>{group.title} ({group.items.length})</a>)}</div>}
        </div>
      </section>

      <div className="shell page-section">
        {groups.map((group) => (
          <section key={group.id} id={group.id} className="destination-group">
            <h2 className="group-title">{group.title}</h2>
            <div className="offer-grid">{group.items.map((listing) => <OfferCard key={listing.offerId} listing={listing} locale={locale} dict={dict} listName={`destination_${slug}`} />)}</div>
          </section>
        ))}

        {groups.length === 0 && (
          <div className="empty-state">
            <Compass size={24} />
            <h3>{fmt(t.emptyTitle, { name: destination.name })}</h3>
            <p>{t.emptyText}</p>
            <div className="empty-actions">
              <Link className="dark-button" href={href(locale, "/proveedores")}>{dict.nav.publish} <ArrowRight size={16} /></Link>
              <WhatsAppButton placement="destination_empty" message={dict.whatsapp.generalMessage} label="WhatsApp" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
