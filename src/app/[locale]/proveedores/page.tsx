import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ProviderApplicationForm } from "@/components/providers/ProviderApplicationForm";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { resolveLocale } from "@/i18n";
import { getDestinations } from "@/lib/catalog";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.providers.title, description: dict.providers.lead };
}

export default async function ProvidersPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const destinations = await getDestinations(locale);
  const t = dict.providers;
  return (
    <section className="shell page-section provider-page">
      <div className="provider-intro">
        <p className="eyebrow warm">{t.eyebrow}</p>
        <h1 className="page-title">{t.title}</h1>
        <p className="section-lead">{t.lead}</p>
        <ul className="check-list">{t.benefits.map((benefit) => <li key={benefit}><Check size={16} /> {benefit}</li>)}</ul>
        <WhatsAppButton placement="providers" message={dict.whatsapp.generalMessage} label={dict.whatsapp.offerButton} />
      </div>
      <ProviderApplicationForm dict={dict} cities={destinations.map((destination) => destination.name)} />
    </section>
  );
}
