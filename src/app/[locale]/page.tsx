import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { BrandIcon, type BrandIconName } from "@/components/site/BrandIcons";
import { DestinationCard } from "@/components/destinations/DestinationCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { OfferCard } from "@/components/offers/OfferCard";
import { OfferExplorer } from "@/components/offers/OfferExplorer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { href, resolveLocale } from "@/i18n";
import { getDestinations, getListings } from "@/lib/catalog";
import { hasCountdown, listingState } from "@/lib/listing";
import { explorerInitial, type SearchParams } from "@/lib/search-params";

// The accommodation search reads ?q=, ?in=, ?out=, ?g= from the URL, so it renders per request.
export const dynamic = "force-dynamic";

const trustIcons: BrandIconName[] = ["verified", "fairPrice", "support"];

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export default async function HomePage({ params, searchParams }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const [listings, destinations, query] = await Promise.all([getListings(locale), getDestinations(locale), searchParams]);
  const initial = explorerInitial(query);
  const t = dict.home;

  const flash = listings.filter((listing) => hasCountdown(listing) && listingState(listing) !== "ended").slice(0, 3);
  const flashIds = new Set(flash.map((listing) => listing.offerId));
  // Accommodations live in the search below the hero; featured shows the rest (tours, packages).
  const featured = listings.filter((listing) => !flashIds.has(listing.offerId) && listing.type !== "accommodation").slice(0, 6);

  return (
    <>
      <HeroSearch locale={locale} dict={dict} />

      <section className="section shell" id="alojamientos">
        <div className="section-heading">
          <div><h2>{dict.explorer.accommodationsTitle}</h2><p className="section-lead">{dict.explorer.accommodationsLead}</p></div>
        </div>
        <OfferExplorer key={JSON.stringify(initial)} mode="accommodations" listings={listings} destinations={destinations} locale={locale} dict={dict} initial={initial} />
      </section>

      {flash.length > 0 && (
        <section className="section shell flash-section" id="flash">
          <div className="section-heading">
            <div><p className="eyebrow warm">{t.flashEyebrow}</p><h2>{t.flashTitle} <em>{t.flashTitleEm}</em></h2><p className="section-lead">{t.flashLead}</p></div>
            <Link className="text-link" href={href(locale, "/ofertas?flash=1")}>{dict.common.seeAll} <ArrowRight size={17} /></Link>
          </div>
          <div className="offer-grid">{flash.map((listing) => <OfferCard key={listing.offerId} listing={listing} locale={locale} dict={dict} listName="home_flash" />)}</div>
        </section>
      )}

      {(featured.length > 0 || listings.length === 0) && <section className="section shell" id="ofertas">
        <div className="section-heading">
          <div><p className="eyebrow warm">{t.offersEyebrow}</p><h2>{t.offersTitle} <em>{t.offersTitleEm}</em></h2></div>
          <Link className="text-link" href={href(locale, "/ofertas")}>{dict.common.seeAll} <ArrowRight size={17} /></Link>
        </div>
        {featured.length > 0
          ? <div className="offer-grid">{featured.map((listing) => <OfferCard key={listing.offerId} listing={listing} locale={locale} dict={dict} listName="home_featured" />)}</div>
          : listings.length === 0 && (
            <div className="empty-state">
              <Compass size={24} />
              <h3>{t.emptyTitle}</h3>
              <p>{t.emptyText}</p>
              <WhatsAppButton placement="home_empty" message={dict.whatsapp.generalMessage} label={dict.whatsapp.offerButton} variant="block" />
            </div>
          )}
      </section>}

      <section className="how-section">
        <div className="shell">
          <p className="eyebrow warm">{t.howEyebrow}</p>
          <h2 className="display-title">{t.howTitle} <em>{t.howTitleEm}</em></h2>
          <ol className="how-steps">{t.howSteps.map((step, index) => <li key={step.title}><span>{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
        </div>
      </section>

      {destinations.length > 0 && (
        <section className="section shell" id="destinos">
          <div className="section-heading">
            <div><p className="eyebrow warm">{t.destinationsEyebrow}</p><h2>{t.destinationsTitle} <em>{t.destinationsTitleEm}</em></h2></div>
            <Link className="text-link" href={href(locale, "/destinos")}>{dict.common.seeAll} <ArrowRight size={17} /></Link>
          </div>
          <div className="destination-grid">
            {destinations.map((destination) => {
              const items = listings.filter((listing) => listing.destination?.slug === destination.slug);
              return <DestinationCard key={destination.slug} destination={destination} count={items.length} image={items.find((item) => item.images[0])?.images[0].url ?? null} locale={locale} dict={dict} />;
            })}
          </div>
        </section>
      )}

      <section className="trust-section" id="confianza">
        <div className="shell trust-inner">
          <div>
            <p className="eyebrow warm">{t.trustEyebrow}</p>
            <h2>{t.trustTitle}<br /><em>{t.trustTitleEm}</em></h2>
            <Link className="text-link" href={href(locale, "/verificacion")}>{t.trustLink} <ArrowRight size={16} /></Link>
          </div>
          <div className="trust-points">
            {t.trustPoints.map((point, index) => {
              return <div key={point.title}><span className="trust-icon"><BrandIcon name={trustIcons[index] ?? "verified"} size={34} /></span><h3>{point.title}</h3><p>{point.text}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="shell provider-band">
        <div>
          <p className="eyebrow warm">{t.providerEyebrow}</p>
          <h2>{t.providerTitle}</h2>
          <p>{t.providerText}</p>
        </div>
        <Link className="dark-button" href={href(locale, "/proveedores")}>{t.providerCta} <ArrowRight size={17} /></Link>
      </section>
    </>
  );
}
