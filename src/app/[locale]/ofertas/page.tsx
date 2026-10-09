import type { Metadata } from "next";
import { OfferExplorer } from "@/components/offers/OfferExplorer";
import { resolveLocale } from "@/i18n";
import { getDestinations, getListings } from "@/lib/catalog";
import { explorerInitial, type SearchParams } from "@/lib/search-params";

// Reads ?q=, ?flash=1... from the URL, so it renders per request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.explorer.offersTitle, description: dict.explorer.offersLead };
}

export default async function OffersPage({ params, searchParams }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const [listings, destinations, query] = await Promise.all([getListings(locale), getDestinations(locale), searchParams]);
  const initial = explorerInitial(query);
  return (
    <section className="shell page-section">
      <header className="page-header">
        <h1 className="page-title">{initial.flashOnly ? dict.nav.flash : dict.explorer.offersTitle}</h1>
        <p className="section-lead">{initial.flashOnly ? dict.home.flashLead : dict.explorer.offersLead}</p>
      </header>
      <OfferExplorer key={JSON.stringify(initial)} mode="offers" listings={listings} destinations={destinations} locale={locale} dict={dict} initial={initial} />
    </section>
  );
}
