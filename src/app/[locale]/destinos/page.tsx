import type { Metadata } from "next";
import { DestinationCard } from "@/components/destinations/DestinationCard";
import { resolveLocale } from "@/i18n";
import { getDestinations, getListings } from "@/lib/catalog";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.destinations.title, description: dict.destinations.lead };
}

export default async function DestinationsPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const [destinations, listings] = await Promise.all([getDestinations(locale), getListings(locale)]);
  return (
    <section className="shell page-section">
      <header className="page-header">
        <h1 className="page-title">{dict.destinations.title}</h1>
        <p className="section-lead">{dict.destinations.lead}</p>
      </header>
      <div className="destination-grid large">
        {destinations.map((destination) => {
          const items = listings.filter((listing) => listing.destination?.slug === destination.slug);
          return <DestinationCard key={destination.slug} destination={destination} count={items.length} image={items.find((item) => item.images[0])?.images[0].url ?? null} locale={locale} dict={dict} />;
        })}
      </div>
    </section>
  );
}
