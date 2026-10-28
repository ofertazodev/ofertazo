"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronUp } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { BrandIcon, type BrandIconName } from "@/components/site/BrandIcons";
import { Modal } from "@/components/site/Modal";
import { LlamaMark } from "@/components/site/TripyaLogo";
import { rememberWaitlist, WAITLIST_STORAGE_KEY, WaitlistForm } from "./WaitlistForm";

const perkIcons: BrandIconName[] = ["tag", "bolt", "verified"];

/** The llama says hi from behind a hill, with a speech bubble. */
export function WaitlistLlama({ hello, size = "lg" }: { hello: string; size?: "md" | "lg" }) {
  return (
    <div className={`waitlist-llama waitlist-llama-${size}`} aria-hidden="true">
      <span className="waitlist-bubble">{hello}</span>
      <span className="waitlist-sun" />
      <LlamaMark className="waitlist-llama-body" />
      <span className="waitlist-hill" />
    </div>
  );
}

type Props = { locale: Locale; t: Dictionary["waitlist"] };

/** Home section: launch waitlist ("Únete a la familia Tripya") with the llama. The form unfolds on demand to keep the home compact. */
export function WaitlistSection({ locale, t }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`waitlist-section ${open ? "open" : ""}`} id="familia-tripya" aria-labelledby="waitlist-title">
      <div className="shell waitlist-inner">
        <WaitlistLlama hello={t.llamaHello} />
        <div className="waitlist-copy">
          <p className="eyebrow warm">{t.kicker}</p>
          <h2 id="waitlist-title">{t.title} <em>{t.titleEm}</em></h2>
          <p className="waitlist-lead">{t.lead}</p>
          <ul className="waitlist-perks">
            {t.perks.map((perk, index) => <li key={perk}><span><BrandIcon name={perkIcons[index] ?? "verified"} size={20} /></span>{perk}</li>)}
          </ul>
        </div>
        <button type="button" className={open ? "ghost-button outlined waitlist-toggle" : "dark-button cta waitlist-toggle"} aria-expanded={open} aria-controls="waitlist-form-card" onClick={() => setOpen(!open)}>
          {open ? t.hide : t.open} {open ? <ChevronUp size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
      {open && (
        <div className="shell">
          <div className="waitlist-card" id="waitlist-form-card">
            <h3>{t.formTitle}</h3>
            <p className="muted">{t.time}</p>
            <WaitlistForm locale={locale} t={t} idPrefix="home" />
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * First visit: the llama invites the visitor to join before browsing the (sample) deals.
 * Dismissable, and never shown again once the visitor joined or said "not now".
 */
export function WaitlistInvite({ locale, t, closeLabel }: Props & { closeLabel: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen: string | null = null;
    try { seen = window.localStorage.getItem(WAITLIST_STORAGE_KEY); } catch { seen = "unavailable"; }
    if (seen) return;
    const id = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  if (!open) return null;
  const close = () => { rememberWaitlist("dismissed"); setOpen(false); };

  return (
    <Modal title={t.formTitle} onClose={close} className="waitlist-modal" closeLabel={closeLabel}>
      <div className="waitlist-modal-head">
        <WaitlistLlama hello={t.llamaHello} size="md" />
        <div>
          <p className="modal-kicker">{t.kicker}</p>
          <h2>{t.title} <em>{t.titleEm}</em></h2>
          <p className="modal-copy">{t.time}</p>
        </div>
      </div>
      <WaitlistForm locale={locale} t={t} idPrefix="invite" onDone={() => setOpen(false)} />
      <button type="button" className="modal-secondary" onClick={close}>{t.later}</button>
    </Modal>
  );
}
