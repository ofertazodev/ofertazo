"use client";

import { Minus, Plus } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plural } from "@/i18n/format";

export type Guests = { adults: number; children: number; infants: number };

const LIMITS = { adults: [1, 50], children: [0, 20], infants: [0, 10] } as const;

/** Clamps guest counts to what the booking function accepts; adults + children also respect the offer capacity. */
export function clampGuests(guests: Guests, capacity: number | null): Guests {
  const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(Math.max(Number.isFinite(value) ? Math.trunc(value) : min, min), max);
  const max = Math.max(capacity ?? Infinity, 1);
  const adults = Math.min(clamp(guests.adults, LIMITS.adults), max);
  return { adults, children: Math.min(clamp(guests.children, LIMITS.children), max - adults), infants: clamp(guests.infants, LIMITS.infants) };
}

/** "2 adultos · 1 niño · 1 bebé" */
export function guestsLabel(guests: Guests, t: Dictionary["booking"]): string {
  return [
    plural(guests.adults, t.adultsCountOne, t.adultsCount),
    guests.children > 0 ? plural(guests.children, t.childrenCountOne, t.childrenCount) : "",
    guests.infants > 0 ? plural(guests.infants, t.infantsCountOne, t.infantsCount) : ""
  ].filter(Boolean).join(" · ");
}

/** Adults / children (2-11) / infants (<2) steppers. Infants don't count toward the capacity. */
export function GuestCounter({ value, onChange, capacity, t }: { value: Guests; onChange: (next: Guests) => void; capacity: number | null; t: Dictionary["booking"] }) {
  const full = capacity !== null && value.adults + value.children >= capacity;
  const rows: { key: keyof Guests; label: string; hint?: string }[] = [
    { key: "adults", label: t.adults },
    { key: "children", label: t.children, hint: t.childrenAge },
    { key: "infants", label: t.infants, hint: t.infantsAge }
  ];
  return (
    <div className="guest-counter">
      {rows.map(({ key, label, hint }) => {
        const [min, max] = LIMITS[key];
        const atMax = value[key] >= max || (key !== "infants" && full);
        return (
          <div className="guest-row" key={key}>
            <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
            <div className="guest-stepper">
              <button type="button" aria-label={`${label} -`} disabled={value[key] <= min} onClick={() => onChange({ ...value, [key]: value[key] - 1 })}><Minus size={16} /></button>
              <output aria-live="polite">{value[key]}</output>
              <button type="button" aria-label={`${label} +`} disabled={atMax} onClick={() => onChange({ ...value, [key]: value[key] + 1 })}><Plus size={16} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
