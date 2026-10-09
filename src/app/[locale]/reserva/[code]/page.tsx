import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { fmt, resolveLocale } from "@/i18n";

type Props = { params: Promise<{ locale: string; code: string }> };

const BOOKING_CODE_PATTERN = /^OFZ-[A-Z0-9]{6}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.confirmation.lookupTitle, robots: { index: false } };
}

export default async function BookingStatusPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const code = decodeURIComponent((await params).code).toUpperCase();
  if (!BOOKING_CODE_PATTERN.test(code)) notFound();

  return (
    <section className="shell page-section narrow">
      <BookingStatus
        code={code}
        locale={locale}
        dict={dict}
        whatsappSlot={<WhatsAppButton placement="booking_status" message={fmt(dict.whatsapp.bookingMessage, { code })} label={dict.help.whatsappCta} variant="block" />}
      />
    </section>
  );
}
