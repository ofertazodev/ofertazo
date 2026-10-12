import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt } from "@/i18n/format";
import { LlamaMark } from "@/components/site/TripyaLogo";

/** The badge appears once this few spots are left, and turns urgent at URGENT_STOCK. */
export const LOW_STOCK = 10;
const URGENT_STOCK = 3;

/**
 * "Only N spots left" badge with the Tripya llama trotting in place. The number always comes from
 * the offer's real capacity minus active bookings — never invent scarcity.
 */
export function ScarcityBadge({ remaining, common, flash = false }: { remaining: number; common: Dictionary["common"]; flash?: boolean }) {
  const urgent = remaining <= URGENT_STOCK;
  const text = remaining === 1 ? common.lastSpot : urgent ? fmt(common.remainingHurry, { n: remaining }) : fmt(common.remaining, { n: remaining });
  return (
    <p className={`scarcity-badge ${urgent ? "urgent" : ""} ${flash ? "flash" : ""}`} role="status">
      <span className="scarcity-llama" aria-hidden="true"><LlamaMark color="currentColor" /></span>
      <span>{text}</span>
    </p>
  );
}
