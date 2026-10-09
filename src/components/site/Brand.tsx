import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/format";
import { TripyaLogo } from "./TripyaLogo";

export function Brand({ locale, inverse = false }: { locale: Locale; inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "inverse" : ""}`} href={href(locale)} aria-label="Tripya">
      <TripyaLogo inverse={inverse} className="brand-logo" />
    </Link>
  );
}
