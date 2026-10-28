"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Users } from "lucide-react";
import { clampGuests, GuestCounter, guestsLabel, type Guests } from "@/components/booking/GuestCounter";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { addDays, todayInBolivia } from "@/lib/dates";
import type { Listing } from "@/lib/listing";

type Props = { listing: Pick<Listing, "slug" | "stayFrom" | "stayTo" | "minNights" | "maxNights" | "capacityMax">; locale: Locale; dict: Dictionary; compact?: boolean };

/** Dates + guests on the offer page; continues to the booking flow with them prefilled. */
export function BookingQuickForm({ listing, locale, dict, compact = false }: Props) {
  const router = useRouter();
  const [today, setToday] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<Guests>(() => clampGuests({ adults: 2, children: 0, infants: 0 }, listing.capacityMax));
  const [guestsOpen, setGuestsOpen] = useState(false);
  useEffect(() => { setToday(todayInBolivia()); }, []);

  const fixedNights = listing.maxNights !== null && listing.maxNights === listing.minNights ? listing.minNights : null;
  const minCheckIn = [today, listing.stayFrom ?? ""].sort().at(-1) || undefined;

  function go(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("in", checkIn);
    if (checkOut) params.set("out", checkOut);
    params.set("g", String(guests.adults));
    if (guests.children) params.set("c", String(guests.children));
    if (guests.infants) params.set("b", String(guests.infants));
    track("begin_checkout", { item_id: listing.slug, placement: compact ? "sticky_bar" : "price_card" });
    router.push(`${href(locale, `/reservar/${listing.slug}`)}?${params.toString()}`);
  }

  if (compact) return <button className="dark-button cta" onClick={() => go()}>{dict.common.bookNow} <ArrowRight size={17} /></button>;

  return (
    <form className="quick-form" onSubmit={go}>
      <div className="form-grid">
        <label>{dict.booking.checkIn}<input type="date" value={checkIn} min={minCheckIn} max={listing.stayTo ?? undefined} onChange={(event) => { setCheckIn(event.target.value); if (event.target.value) setCheckOut(addDays(event.target.value, fixedNights ?? listing.minNights)); }} /></label>
        <label>{dict.booking.checkOut}<input type="date" value={checkOut} min={checkIn || minCheckIn} max={listing.stayTo ?? undefined} disabled={Boolean(fixedNights)} onChange={(event) => setCheckOut(event.target.value)} /></label>
      </div>
      <div className="guest-picker">
        <p className="field-label">{dict.booking.guests}</p>
        <button type="button" className="guest-picker-toggle" aria-expanded={guestsOpen} onClick={() => setGuestsOpen(!guestsOpen)}>
          <Users size={17} /> <span>{guestsLabel(guests, dict.booking)}</span> <ChevronDown size={17} />
        </button>
        {guestsOpen && <GuestCounter value={guests} onChange={setGuests} capacity={listing.capacityMax} t={dict.booking} />}
      </div>
      <button className="dark-button cta form-button">{dict.common.bookNow} <ArrowRight size={17} /></button>
    </form>
  );
}
