"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt } from "@/i18n/format";
import { LlamaMark } from "@/components/site/TripyaLogo";

/** The badge appears once this few spots are left, and turns urgent at URGENT_STOCK. */
export const LOW_STOCK = 10;
const URGENT_STOCK = 3;
const SWAP_MS = 2500;

type Props = {
  remaining: number;
  common: Dictionary["common"];
  flash?: boolean;
  /** Where the booking form is (offer page + #reservar). */
  bookingHref: string;
  /** Inside a card that is already a link: navigate on click instead of nesting another <a>. */
  insideLink?: boolean;
};

/**
 * "Only N spots left" badge that alternates with "Book now!" and takes the visitor to the booking
 * form, with the Tripya llama trotting in place. The number always comes from the offer's real
 * capacity minus active bookings — never invent scarcity.
 */
export function ScarcityBadge({ remaining, common, flash = false, bookingHref, insideLink = false }: Props) {
  const router = useRouter();
  const [showCta, setShowCta] = useState(false);
  const [entering, setEntering] = useState(false);
  const urgent = remaining <= URGENT_STOCK;
  const text = remaining === 1 ? common.lastSpot : urgent ? fmt(common.remainingHurry, { n: remaining }) : fmt(common.remaining, { n: remaining });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const id = window.setInterval(() => {
      // Place the new line below, then let the CSS transition slide it up. If transitions don't run
      // in this browser, the line simply appears in place: it is never left hidden or shifted.
      setEntering(true);
      setShowCta((current) => !current);
      frame = window.requestAnimationFrame(() => { frame = window.requestAnimationFrame(() => setEntering(false)); });
    }, SWAP_MS);
    return () => { window.clearInterval(id); window.cancelAnimationFrame(frame); };
  }, []);

  const className = `scarcity-badge ${urgent ? "urgent" : ""} ${flash ? "flash" : ""}`;
  const content = (
    <>
      <span className="scarcity-llama" aria-hidden="true"><LlamaMark color="currentColor" /></span>
      <span className="scarcity-text">
        {/* Invisible copies reserve the width of the longer text so the badge doesn't jump. */}
        <span className="scarcity-sizer" aria-hidden="true">{text}</span>
        <span className="scarcity-sizer" aria-hidden="true">{common.bookNowShort}</span>
        {/* Only one visible line at a time. */}
        <span className={`scarcity-line ${entering ? "entering" : ""}`}>{showCta ? common.bookNowShort : text}</span>
      </span>
    </>
  );

  if (insideLink) {
    const go = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); router.push(bookingHref); };
    return <span className={className} onClick={go} title={common.bookNowShort}>{content}</span>;
  }
  return <a className={className} href={bookingHref} aria-label={`${text} ${common.bookNowShort}`}>{content}</a>;
}
