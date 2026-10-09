import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href, plural } from "@/i18n/format";
import type { Destination } from "@/lib/listing";

export function DestinationCard({ destination, count, image, locale, dict }: { destination: Destination; count: number; image: string | null; locale: Locale; dict: Dictionary }) {
  const cover = destination.imageUrl ?? image;
  return (
    <Link href={href(locale, `/destinos/${destination.slug}`)} className={`destination-card ${count === 0 ? "is-empty" : ""}`}>
      {cover ? <Image src={cover} alt={destination.name} fill sizes="(max-width: 800px) 50vw, 300px" /> : <div className="image-placeholder" />}
      <div className="destination-card-body">
        <h3>{destination.name}</h3>
        <span>{count > 0 ? plural(count, dict.destinations.offersCountOne, dict.destinations.offersCount) : dict.destinations.comingSoon} <ArrowRight size={14} /></span>
      </div>
    </Link>
  );
}
