"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt } from "@/i18n/format";
import { LlamaMark } from "@/components/site/TripyaLogo";

/** The badge appears once this few spots are left, and turns urgent at URGENT_STOCK. */
export const LOW_STOCK = 10;
const URGENT_STOCK = 3;

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
  const urgent = remaining <= URGENT_STOCK;
  const text = remaining === 1 ? common.lastSpot : urgent ? fmt(common.remainingHurry, { n: remaining }) : fmt(common.remaining, { n: remaining });
  const className = `scarcity-badge ${urgent ? "urgent" : ""} ${flash ? "flash" : ""}`;
  const content = (
    <>
      <span className="scarcity-llama" aria-hidden="true"><LlamaMark color="currentColor" /></span>
      <span className="scarcity-text">
        <span className="scarcity-line">{text}</span>
        <span className="scarcity-line cta" aria-hidden="true">{common.bookNowShort}</span>
      </span>
    </>
  );

  if (insideLink) {
    const go = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); router.push(bookingHref); };
    return <span className={className} onClick={go} title={common.bookNowShort}>{content}</span>;
  }
  return <a className={className} href={bookingHref} aria-label={`${text} ${common.bookNowShort}`}>{content}</a>;
}
