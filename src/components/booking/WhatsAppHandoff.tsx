"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { formatDate } from "@/lib/dates";
import { formatMoney, money } from "@/lib/money";
import { supabase } from "@/lib/supabase-browser";
import { whatsappUrl } from "@/lib/whatsapp";
import { LlamaLoader } from "@/components/site/TripyaLogo";

const SECONDS = 5;

type Handoff = {
  code: string;
  title: string;
  partner: string | null;
  destination: string | null;
  check_in: string | null;
  check_out: string | null;
  nights: number | null;
  guests: number | null;
  extras: { name?: string }[] | null;
  total_minor: number;
  currency_code: string;
  contact_name: string;
  contact_phone: string | null;
};

/** WhatsApp message for the sales agent: everything needed to send the right partner's payment QR. */
function buildMessage(data: Handoff, locale: Locale, dict: Dictionary) {
  const w = dict.whatsapp;
  const date = (iso: string) => formatDate(iso, locale, { day: "numeric", month: "short", year: "numeric" });
  const lines = [
    w.handoffIntro,
    "",
    `${w.handoffCode}: ${data.code}`,
    `${w.handoffOffer}: ${data.title}`,
    data.partner ? `${w.handoffPartner}: ${data.partner}` : "",
    data.destination ? `${w.handoffDestination}: ${data.destination}` : "",
    data.check_in && data.check_out ? `${w.handoffDates}: ${date(data.check_in)} → ${date(data.check_out)}${data.nights ? ` (${data.nights} ${w.handoffNights})` : ""}` : "",
    data.guests ? `${w.handoffGuests}: ${data.guests}` : "",
    data.extras?.length ? `${w.handoffExtras}: ${data.extras.map((extra) => extra.name).filter(Boolean).join(", ")}` : "",
    `${w.handoffTotal}: ${formatMoney(money(data.total_minor, data.currency_code), locale)}`,
    `${w.handoffName}: ${data.contact_name}`,
    data.contact_phone ? `${w.handoffPhone}: ${data.contact_phone}` : "",
    "",
    w.handoffClosing
  ];
  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n").trim();
}

/**
 * Full-screen "connecting you with our sales agent" step shown after a booking request:
 * the llama trots for 5 seconds, then the traveler is sent to the agent's WhatsApp with the booking details.
 */
export function WhatsAppHandoff({ code, email, locale, dict }: { code: string; email: string; locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const t = dict.booking;
  const [url, setUrl] = useState<string | null>(null);
  const [left, setLeft] = useState(SECONDS);
  const bookingPage = href(locale, `/reserva/${code}`);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = supabase ? await supabase.rpc("booking_whatsapp_handoff", { p_code: code, p_email: email }) : { data: null };
      if (cancelled) return;
      const link = data ? whatsappUrl(buildMessage(data as Handoff, locale, dict)) : null;
      // Without a configured WhatsApp number (or if the lookup failed) the booking page shows the next steps.
      if (!link) { router.push(bookingPage); return; }
      setUrl(link);
    })();
    return () => { cancelled = true; };
  }, [code, email, locale, dict, router, bookingPage]);

  useEffect(() => {
    if (!url) return;
    if (left <= 0) {
      track("click_whatsapp", { placement: "booking_handoff" });
      // Leave the booking page in history, so "back" from WhatsApp shows the booking status.
      window.history.replaceState(null, "", bookingPage);
      window.location.assign(url);
      return;
    }
    const id = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [url, left, bookingPage]);

  return (
    <div className="handoff-overlay" role="dialog" aria-modal="true" aria-live="polite" aria-label={t.handoffTitle}>
      <div className="handoff-card">
        <LlamaLoader size="lg" />
        <h2>{t.handoffTitle}</h2>
        <p>{t.handoffText}</p>
        <div className="handoff-progress" aria-hidden="true">{url && <span style={{ animationDuration: `${SECONDS}s` }} />}</div>
        <p className="handoff-count">{url ? fmt(t.handoffIn, { n: Math.max(left, 0) }) : "…"}</p>
        {url && <a className="dark-button handoff-button" href={url} onClick={() => window.history.replaceState(null, "", bookingPage)}><MessageCircle size={18} /> {t.handoffButton}</a>}
        <a className="modal-secondary" href={bookingPage}>{t.handoffView}</a>
      </div>
    </div>
  );
}
