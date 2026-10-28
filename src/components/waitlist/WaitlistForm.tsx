"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, PartyPopper } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { getAttribution } from "@/lib/analytics";
import { supabase } from "@/lib/supabase-browser";

export const WAITLIST_DESTINATIONS = ["tarija", "santa_cruz", "la_paz_uyuni", "sucre_potosi", "cochabamba", "other"] as const;
export const WAITLIST_INTERESTS = ["yes", "depends", "curious"] as const;
type WaitlistDestination = (typeof WAITLIST_DESTINATIONS)[number];
type WaitlistInterest = (typeof WAITLIST_INTERESTS)[number];
type ErrorKey = keyof Dictionary["waitlist"]["errors"];

/** Remembers in this browser that the visitor joined or dismissed the invitation, so the welcome popup is not shown again. */
export const WAITLIST_STORAGE_KEY = "tripya_waitlist";
export function rememberWaitlist(value: "joined" | "dismissed") {
  try { window.localStorage.setItem(WAITLIST_STORAGE_KEY, value); } catch { /* private mode: the popup may show again */ }
}

type Props = { locale: Locale; t: Dictionary["waitlist"]; onDone?: () => void; idPrefix: string };

/** "Únete a la lista de primeros viajeros": saved through join_waitlist() and listed in admin → Viajeros. */
export function WaitlistForm({ locale, t, onDone, idPrefix }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [destination, setDestination] = useState<WaitlistDestination | "">("");
  const [interest, setInterest] = useState<WaitlistInterest | "">("");
  const [updates, setUpdates] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function problem(): ErrorKey | null {
    if (!firstName.trim()) return "invalid_first_name";
    if (!lastName.trim()) return "invalid_last_name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return "invalid_email";
    if (whatsapp.trim() && whatsapp.replace(/\D/g, "").length < 7) return "invalid_whatsapp";
    if (!destination) return "invalid_destination";
    if (!interest) return "invalid_interest";
    if (!privacy) return "privacy_required";
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = problem();
    if (invalid) { setError(t.errors[invalid]); return; }
    if (!supabase) { setError(t.errors.generic); return; }
    setBusy(true); setError("");
    const { error: rpcError } = await supabase.rpc("join_waitlist", {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_email: email.trim(),
      p_whatsapp: whatsapp.trim() || null,
      p_destination: destination,
      p_interest: interest,
      p_wants_updates: updates,
      p_privacy_accepted: privacy,
      p_locale: locale,
      p_attribution: getAttribution()
    });
    setBusy(false);
    if (rpcError) {
      const key = (Object.keys(t.errors) as ErrorKey[]).find((candidate) => rpcError.message.includes(candidate));
      setError(t.errors[key ?? "generic"]);
      return;
    }
    rememberWaitlist("joined");
    setDone(true);
  }

  if (done) return (
    <div className="waitlist-success" role="status">
      <span className="waitlist-success-icon"><PartyPopper size={30} /></span>
      <h3>{t.successTitle}</h3>
      <p>{t.successText}</p>
      <Link className="dark-button cta" href={href(locale, "/ofertas")} onClick={onDone}>{t.seeOffers} <ArrowRight size={17} /></Link>
    </div>
  );

  const [privacyBefore, privacyAfter] = t.privacy.split("{privacy}");
  return (
    <form className="waitlist-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label>{t.firstName} *<input required autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
        <label>{t.lastName} *<input required autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
      </div>
      <label>{t.email} *<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>{t.whatsapp}<input type="tel" autoComplete="tel" maxLength={30} placeholder="+591" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} /><small>{t.whatsappHint}</small></label>

      <fieldset className="waitlist-choices">
        <legend>{t.destinationQuestion} *</legend>
        <div className="waitlist-chips">
          {WAITLIST_DESTINATIONS.map((value) => (
            <label key={value} className={`waitlist-chip ${destination === value ? "active" : ""}`}>
              <input type="radio" name={`${idPrefix}-destination`} value={value} checked={destination === value} onChange={() => setDestination(value)} />
              {destination === value && <Check size={15} />}{t.destinations[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="waitlist-choices">
        <legend>{t.interestQuestion} *</legend>
        <div className="waitlist-options">
          {WAITLIST_INTERESTS.map((value) => (
            <label key={value} className={`waitlist-option ${interest === value ? "active" : ""}`}>
              <input type="radio" name={`${idPrefix}-interest`} value={value} checked={interest === value} onChange={() => setInterest(value)} />
              <span>{t.interests[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="check-row"><input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} /><span>{t.updates}</span></label>
      <label className="check-row"><input type="checkbox" required checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} /><span>{privacyBefore}<Link href={href(locale, "/legal/privacidad")} target="_blank">{t.privacyLink}</Link>{privacyAfter} *</span></label>

      {error && <p className="form-message" role="alert">{error}</p>}
      <button className="dark-button cta form-button" disabled={busy}>{busy ? t.submitting : t.submit} <ArrowRight size={17} /></button>
    </form>
  );
}
