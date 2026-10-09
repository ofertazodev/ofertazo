"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock, Minus, Plus } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href, plural } from "@/i18n/format";
import { getAttribution, track } from "@/lib/analytics";
import { addDays, formatDate, nightsBetween, todayInBolivia } from "@/lib/dates";
import type { Listing } from "@/lib/listing";
import { addMoney, formatMoney, money, multiplyMoney, type Money } from "@/lib/money";
import { supabase } from "@/lib/supabase-browser";

type Props = {
  listing: Listing;
  locale: Locale;
  dict: Dictionary;
  initial: { checkIn: string; checkOut: string; guests: number };
  whatsappSlot: React.ReactNode;
};

type ErrorKey = keyof Dictionary["booking"]["errors"];

export const BOOKING_EMAIL_KEY = (code: string) => `ofz_booking_email_${code}`;

export function BookingFlow({ listing, locale, dict, initial, whatsappSlot }: Props) {
  const t = dict.booking;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [today, setToday] = useState("");
  const [checkIn, setCheckIn] = useState(initial.checkIn);
  const [checkOut, setCheckOut] = useState(initial.checkOut);
  const [guests, setGuests] = useState(Math.max(1, Math.min(initial.guests || 2, listing.capacityMax ?? 50)));
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setToday(todayInBolivia()); }, []);
  useEffect(() => { track("checkout_step", { item_id: listing.slug, step: step + 1 }); }, [step, listing.slug]);

  const fixedNights = listing.maxNights !== null && listing.maxNights === listing.minNights ? listing.minNights : null;
  const nights = nightsBetween(checkIn, checkOut);
  const minCheckIn = [today, listing.stayFrom ?? ""].sort().at(-1) || undefined;

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (value && (fixedNights || !checkOut || checkOut <= value)) setCheckOut(addDays(value, fixedNights ?? listing.minNights));
  }

  const estimate = useMemo(() => {
    const base: Money = listing.pricingUnit === "per_night" ? multiplyMoney(listing.promo, Math.max(nights, 0))
      : listing.pricingUnit === "per_person" ? multiplyMoney(listing.promo, guests)
      : listing.promo;
    const extras = listing.extras.filter((extra) => extraIds.includes(extra.id)).reduce((sum, extra) => addMoney(sum, extra.price), money(0, listing.promo.currency));
    return { base, extras, total: addMoney(base, extras) };
  }, [extraIds, guests, listing, nights]);

  function datesError(): ErrorKey | null {
    if (!checkIn || !checkOut || nights <= 0) return "invalid_dates";
    if (today && checkIn < today) return "invalid_dates";
    if ((listing.stayFrom && checkIn < listing.stayFrom) || (listing.stayTo && checkOut > listing.stayTo)) return "dates_unavailable";
    if (nights < listing.minNights || (listing.maxNights !== null && nights > listing.maxNights)) return "invalid_nights";
    return null;
  }

  function stepError(): ErrorKey | null {
    if (step === 0) return datesError();
    if (step === 1 && (guests < 1 || (listing.capacityMax !== null && guests > listing.capacityMax))) return "too_many_guests";
    if (step === 2) {
      if (name.trim().length < 2) return "invalid_name";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return "invalid_email";
      if (phone.replace(/\D/g, "").length < 7) return "invalid_phone";
    }
    return null;
  }

  function next(event?: FormEvent) {
    event?.preventDefault();
    const problem = stepError();
    if (problem) { setError(t.errors[problem]); return; }
    setError("");
    setStep((current) => Math.min(current + 1, t.steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accepted) return;
    if (!supabase) { setError(t.errors.generic); return; }
    setSubmitting(true); setError("");
    const { data, error: rpcError } = await supabase.rpc("create_booking_request", {
      p_offer_id: listing.offerId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guests: guests,
      p_extra_ids: extraIds,
      p_contact_name: name.trim(),
      p_contact_email: email.trim(),
      p_contact_phone: phone.trim(),
      p_notes: notes.trim() || null,
      p_locale: locale,
      p_attribution: getAttribution()
    });
    if (rpcError || typeof data !== "string") {
      setSubmitting(false);
      const key = Object.keys(t.errors).find((candidate) => rpcError?.message.includes(candidate)) as ErrorKey | undefined;
      setError(t.errors[key ?? "generic"]);
      return;
    }
    try { window.sessionStorage.setItem(BOOKING_EMAIL_KEY(data), email.trim().toLowerCase()); } catch { /* the confirmation page asks for the email instead */ }
    track("generate_lead", { item_id: listing.slug, value: Number(estimate.total.amount) / 100, currency: estimate.total.currency, nights, guests });
    router.push(href(locale, `/reserva/${data}`));
  }

  const summary = (
    <aside className="booking-summary">
      <p className="eyebrow warm">{t.summary}</p>
      <h3>{listing.title}</h3>
      {listing.destination && <p className="muted">{listing.destination.name}</p>}
      <dl>
        {checkIn && checkOut && nights > 0 && <><dt>{t.checkIn} → {t.checkOut}</dt><dd>{formatDate(checkIn, locale, { day: "numeric", month: "short" })} → {formatDate(checkOut, locale, { day: "numeric", month: "short" })} · {plural(nights, dict.common.nightsOne, dict.common.nights)}</dd></>}
        <dt>{t.guests}</dt><dd>{plural(guests, dict.common.guestsOne, dict.common.guests)}</dd>
        <dt>{t.base}</dt><dd>{formatMoney(estimate.base, locale)}</dd>
        {estimate.extras.amount > BigInt(0) && <><dt>{t.extrasTotal}</dt><dd>{formatMoney(estimate.extras, locale)}</dd></>}
      </dl>
      <div className="booking-total"><span>{t.total}</span><strong>{formatMoney(estimate.total, locale)}</strong></div>
      <p className="fine-print">{t.totalNote}</p>
    </aside>
  );

  return (
    <div className="booking-layout">
      <div className="booking-main">
        <ol className="stepper-bar" aria-label={fmt(t.stepOf, { current: step + 1, total: t.steps.length })}>
          {t.steps.map((label, index) => <li key={label} className={index === step ? "current" : index < step ? "done" : ""}><span>{index < step ? <Check size={13} /> : index + 1}</span>{label}</li>)}
        </ol>
        <p className="step-count">{fmt(t.stepOf, { current: step + 1, total: t.steps.length })}</p>

        <form className="booking-step" onSubmit={step === t.steps.length - 1 ? submit : next} noValidate>
          {step === 0 && (
            <>
              <h2>{t.steps[0]}</h2>
              <div className="form-grid">
                <label>{t.checkIn}<input type="date" required value={checkIn} min={minCheckIn} max={listing.stayTo ?? undefined} onChange={(event) => changeCheckIn(event.target.value)} /></label>
                <label>{t.checkOut}<input type="date" required value={checkOut} min={checkIn ? addDays(checkIn, listing.minNights) : minCheckIn} max={listing.stayTo ?? undefined} disabled={Boolean(fixedNights)} onChange={(event) => setCheckOut(event.target.value)} /></label>
              </div>
              {nights > 0 && <p className="hint strong">{plural(nights, t.nightsSelectedOne, t.nightsSelected)}</p>}
              {listing.minNights > 1 && <p className="hint">{fmt(t.minNightsHint, { n: listing.minNights })}</p>}
              {listing.maxNights !== null && listing.maxNights !== listing.minNights && <p className="hint">{fmt(t.maxNightsHint, { n: listing.maxNights })}</p>}
            </>
          )}

          {step === 1 && (
            <>
              <h2>{t.steps[1]}</h2>
              <p className="field-label">{t.guests}</p>
              <div className="stepper">
                <button type="button" aria-label="-" onClick={() => setGuests(Math.max(1, guests - 1))}><Minus size={18} /></button>
                <strong>{guests}</strong>
                <button type="button" aria-label="+" onClick={() => setGuests(Math.min(listing.capacityMax ?? 50, guests + 1))}><Plus size={18} /></button>
              </div>
              {listing.capacityMax !== null && <p className="hint">{fmt(t.capacityHint, { n: listing.capacityMax })}</p>}
              {listing.extras.length > 0 && (
                <fieldset className="extras-list">
                  <legend>{t.extras}</legend>
                  {listing.extras.map((extra) => (
                    <label key={extra.id} className="extra-option">
                      <input type="checkbox" checked={extraIds.includes(extra.id)} onChange={(event) => setExtraIds(event.target.checked ? [...extraIds, extra.id] : extraIds.filter((id) => id !== extra.id))} />
                      <span>{extra.name}</span><b>+ {formatMoney(extra.price, locale)}</b>
                    </label>
                  ))}
                </fieldset>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2>{t.steps[2]}</h2>
              <label>{t.name}<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></label>
              <div className="form-grid">
                <label>{t.email}<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} /></label>
                <label>{t.phone}<input required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} placeholder="+591" /><small>{t.phoneHint}</small></label>
              </div>
              <label>{t.notes}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder={t.notesPlaceholder} /></label>
            </>
          )}

          {step === 3 && (
            <>
              <h2>{t.paymentTitle}</h2>
              <div className="info-card"><Lock size={20} /><div><p>{t.paymentText}</p><p className="muted">{t.paymentSafe}</p></div></div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>{t.steps[4]}</h2>
              <dl className="review-list">
                <dt>{t.checkIn} → {t.checkOut}</dt><dd>{formatDate(checkIn, locale)} → {formatDate(checkOut, locale)} ({plural(nights, dict.common.nightsOne, dict.common.nights)})</dd>
                <dt>{t.guests}</dt><dd>{guests}</dd>
                {extraIds.length > 0 && <><dt>{t.extrasTotal}</dt><dd>{listing.extras.filter((extra) => extraIds.includes(extra.id)).map((extra) => extra.name).join(", ")}</dd></>}
                <dt>{t.name}</dt><dd>{name}</dd>
                <dt>{t.email}</dt><dd>{email}</dd>
                <dt>{t.phone}</dt><dd>{phone}</dd>
              </dl>
              <label className="check-row">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required />
                <span>{t.acceptTerms.split(/(\{terms\}|\{cancellation\})/).map((part) =>
                  part === "{terms}" ? <Link key={part} href={href(locale, "/legal/condiciones-reserva")} target="_blank">{t.termsLink}</Link>
                  : part === "{cancellation}" ? <Link key={part} href={href(locale, "/legal/cancelacion")} target="_blank">{t.cancellationLink}</Link>
                  : part)}</span>
              </label>
            </>
          )}

          {error && <p className="form-message" role="alert">{error}</p>}

          <div className="step-actions">
            {step > 0 && <button type="button" className="ghost-button" onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft size={16} /> {t.previous}</button>}
            {step < t.steps.length - 1
              ? <button className="dark-button">{t.next} <ArrowRight size={17} /></button>
              : <button className="dark-button cta" disabled={!accepted || submitting}>{submitting ? t.submitting : t.submit} <ArrowRight size={17} /></button>}
          </div>
        </form>
        <div className="booking-help">{whatsappSlot}</div>
      </div>
      {summary}
    </div>
  );
}
