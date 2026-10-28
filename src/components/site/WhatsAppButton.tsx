"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { track } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/whatsapp";
import { LlamaLoader } from "./TripyaLogo";

/** How long the llama trots before we open WhatsApp (also used by the booking handoff). */
export const WHATSAPP_REDIRECT_SECONDS = 3;

type RedirectLabels = { title: string; text: string; now: string; cancel: string };

type Props = {
  message: string;
  label: string;
  /** Where the click happened, sent to analytics (floating, offer, booking, help...). */
  placement: string;
  variant?: "floating" | "inline" | "block";
  offerSlug?: string;
  redirect: RedirectLabels;
};

export function WhatsAppButton({ message, label, placement, variant = "inline", offerSlug, redirect }: Props) {
  const url = whatsappUrl(message);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    if (!going || !url) return;
    const id = window.setTimeout(() => { setGoing(false); window.location.assign(url); }, WHATSAPP_REDIRECT_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [going, url]);

  if (!url) return null;
  return (
    <>
      <a
        className={`whatsapp-button whatsapp-${variant}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        onClick={(event) => {
          track("click_whatsapp", { placement, offer: offerSlug });
          // Ctrl/cmd-click etc. keep the browser's normal behavior; a plain click shows the llama first.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          setGoing(true);
        }}
      >
        <MessageCircle size={variant === "floating" ? 24 : 18} />
        <span>{label}</span>
      </a>
      {going && createPortal(<RedirectOverlay url={url} labels={redirect} onCancel={() => setGoing(false)} />, document.body)}
    </>
  );
}

function RedirectOverlay({ url, labels, onCancel }: { url: string; labels: RedirectLabels; onCancel: () => void }) {
  return (
    <div className="handoff-overlay" role="dialog" aria-modal="true" aria-live="polite" aria-label={labels.title}>
      <div className="handoff-card">
        <LlamaLoader size="lg" />
        <h2>{labels.title}</h2>
        <p>{labels.text}</p>
        <div className="handoff-progress" aria-hidden="true"><span style={{ animationDuration: `${WHATSAPP_REDIRECT_SECONDS}s` }} /></div>
        <a className="dark-button handoff-button" href={url}><MessageCircle size={18} /> {labels.now}</a>
        <button type="button" className="modal-secondary" onClick={onCancel}>{labels.cancel}</button>
      </div>
    </div>
  );
}
