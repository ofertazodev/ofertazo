import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { fmt, href, resolveLocale } from "@/i18n";
import { getListingBySlug } from "@/lib/catalog";
import { listingState } from "@/lib/listing";
import { siteUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const isoDate = (value: string | string[] | undefined) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.booking.title, robots: { index: false } };
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const query = await searchParams;
  const listing = await getListingBySlug(slug, locale);
  if (!listing) notFound();
  if (listingState(listing) !== "active" || listing.isSample) redirect(href(locale, `/ofertas/${slug}`));

  const offerUrl = `${siteUrl}/${locale}/ofertas/${slug}`;
  return (
    <section className="shell page-section booking-page">
      <Link className="back-link" href={href(locale, `/ofertas/${slug}`)}><ArrowLeft size={16} /> {listing.title}</Link>
      <h1 className="page-title">{dict.booking.title}</h1>
      <BookingFlow
        listing={listing}
        locale={locale}
        dict={dict}
        initial={{ checkIn: isoDate(query.in), checkOut: isoDate(query.out), guests: Number(query.g) || 2 }}
        whatsappSlot={<><p className="muted">{dict.whatsapp.offerCta}</p><WhatsAppButton placement="booking_flow" message={fmt(dict.whatsapp.offerMessage, { title: listing.title, url: offerUrl })} label={dict.whatsapp.offerButton} offerSlug={slug} /></>}
      />
    </section>
  );
}
