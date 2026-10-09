"use client";

import { MessageCircle } from "lucide-react";
import { track } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = {
  message: string;
  label: string;
  /** Where the click happened, sent to analytics (floating, offer, booking, help...). */
  placement: string;
  variant?: "floating" | "inline" | "block";
  offerSlug?: string;
};

export function WhatsAppButton({ message, label, placement, variant = "inline", offerSlug }: Props) {
  const url = whatsappUrl(message);
  if (!url) return null;
  return (
    <a
      className={`whatsapp-button whatsapp-${variant}`}
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onClick={() => track("click_whatsapp", { placement, offer: offerSlug })}
    >
      <MessageCircle size={variant === "floating" ? 24 : 18} />
      <span>{label}</span>
    </a>
  );
}
