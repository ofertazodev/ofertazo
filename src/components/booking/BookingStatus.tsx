"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href, plural } from "@/i18n/format";
import { formatDate, nightsBetween } from "@/lib/dates";
import { formatMoney, money } from "@/lib/money";
import { supabase } from "@/lib/supabase-browser";
import { BOOKING_EMAIL_KEY } from "./BookingFlow";
import { LlamaLoader } from "@/components/site/TripyaLogo";

type BookingSummary = {
  code: string;
  status: keyof Dictionary["confirmation"]["statuses"];
  check_in: string;
  check_out: string;
  guests: number;
  total_minor: number;
  currency_code: string;
  contact_name: string;
  title: string;
  product_slug: string;
  extras: { id: string; name: string; price_minor: number }[];
};

type Props = { code: string; locale: Locale; dict: Dictionary; whatsappSlot: React.ReactNode };

export function BookingStatus({ code, locale, dict, whatsappSlot }: Props) {
  const t = dict.confirmation;
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"checking" | "form" | "loading" | "notFound" | "ready">("checking");
  const [justCreated, setJustCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  const lookup = useCallback(async (lookupEmail: string) => {
    if (!supabase) { setState("notFound"); return; }
    setState("loading");
    const { data, error } = await supabase.rpc("get_booking_by_code", { p_code: code, p_email: lookupEmail });
    if (error || !data) { setState("notFound"); return; }
    setBooking(data as BookingSummary);
    setState("ready");
  }, [code]);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.sessionStorage.getItem(BOOKING_EMAIL_KEY(code)); } catch { stored = null; }
    if (stored) { setJustCreated(true); setEmail(stored); void lookup(stored); } else setState("form");
  }, [code, lookup]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup(email.trim());
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setCopied(false); }
  }

  if (state === "checking" || state === "loading") return <div className="status-card"><LlamaLoader label={dict.common.loading} /></div>;

  if (state === "form" || state === "notFound" || !booking) {
    return (
      <form className="status-card lookup-form" onSubmit={submit}>
        <h1>{t.lookupTitle}</h1>
        <p className="muted">{t.lookupText}</p>
        <label>{t.lookupCode}<input value={code} readOnly /></label>
        <label>{t.lookupEmail}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        {state === "notFound" && <p className="form-message">{t.notFound}</p>}
        <button className="dark-button">{t.lookupButton} <ArrowRight size={17} /></button>
      </form>
    );
  }

  const nights = nightsBetween(booking.check_in, booking.check_out);
  return (
    <div className="status-card">
      {justCreated && <span className="success-icon"><CheckCircle2 /></span>}
      <p className="eyebrow warm">{justCreated ? t.eyebrow : t.status}</p>
      <h1>{justCreated ? fmt(t.title, { name: booking.contact_name.split(" ")[0] }) : booking.title}</h1>
      <div className="code-box">
        <span>{t.codeLabel}</span>
        <strong>{booking.code}</strong>
        <button onClick={copyCode} aria-label="Copy"><Copy size={16} /> {copied ? "✓" : ""}</button>
        <small>{t.codeHint}</small>
      </div>
      <dl className="review-list">
        <dt>{t.status}</dt><dd><span className={`status-pill status-${booking.status}`}>{t.statuses[booking.status]}</span></dd>
        {justCreated && <><dt>{dict.offer.aboutOffer}</dt><dd>{booking.title}</dd></>}
        <dt>{t.dates}</dt><dd>{formatDate(booking.check_in, locale)} → {formatDate(booking.check_out, locale)} ({plural(nights, dict.common.nightsOne, dict.common.nights)})</dd>
        <dt>{t.guests}</dt><dd>{booking.guests}</dd>
        {booking.extras.length > 0 && <><dt>{t.extras}</dt><dd>{booking.extras.map((extra) => extra.name).join(", ")}</dd></>}
        <dt>{t.total}</dt><dd><strong>{formatMoney(money(booking.total_minor, booking.currency_code), locale)}</strong></dd>
      </dl>
      {booking.status === "pending" && (
        <div className="next-steps">
          <h2>{t.nextTitle}</h2>
          <ol>{t.nextSteps.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      )}
      <div className="info-card"><p>{t.help}</p>{whatsappSlot}</div>
      <Link className="text-link" href={href(locale, `/ofertas/${booking.product_slug}`)}>{t.backToOffer} <ArrowRight size={16} /></Link>
    </div>
  );
}
