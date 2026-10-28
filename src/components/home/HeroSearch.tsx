"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Search, ShieldCheck } from "lucide-react";
import { BrandIcon, type BrandIconName } from "@/components/site/BrandIcons";
import { SearchSuggest, type Suggestion } from "@/components/site/SearchSuggest";
import { matchScore } from "@/lib/fuzzy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { todayInBolivia } from "@/lib/dates";

// Christopher Crouzet, CC BY-SA 4.0, via Wikimedia Commons (credited on the photo).
const HERO_IMAGE = "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg/1920px-Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg";

/** What "Buscar" looks for: everything, only stays (searched on the home page) or tours + getaways. */
type Tab = "offers" | "accommodation" | "trips";

export function HeroSearch({ locale, dict, suggestions }: { locale: Locale; dict: Dictionary; suggestions: Suggestion[] }) {
  const home = dict.home;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("accommodation");
  const [destination, setDestination] = useState("");
  /** Slug of the place picked from the suggestions (cleared when the text changes). */
  const [place, setPlace] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [today, setToday] = useState<string>();

  useEffect(() => { setToday(todayInBolivia()); }, []);

  const tabs: { id: Tab; label: string; hint: string; icon: BrandIconName }[] = [
    { id: "offers", label: home.tabOffers, hint: home.tabOffersHint, icon: "tag" },
    { id: "accommodation", label: home.tabAccommodations, hint: home.tabAccommodationsHint, icon: "bed" },
    { id: "trips", label: home.tabTrips, hint: home.tabTripsHint, icon: "mountain" }
  ];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    // A picked place filters by destination; free text that matches exactly one place (even misspelled) does too.
    const places = suggestions.filter((item) => item.kind === "place" && matchScore(destination, item.label) !== null);
    const slug = place || (destination.trim() && places.length === 1 ? places[0].id : "");
    if (slug) params.set("destino", slug);
    else if (destination.trim()) params.set("q", destination.trim());
    if (checkIn) params.set("in", checkIn);
    if (checkOut) params.set("out", checkOut);
    track("search", { search_term: destination.trim() });
    // Accommodations are searched on the home page itself; the rest in the full offer list.
    if (tab === "trips") params.set("categoria", "circuitos");
    const qs = params.toString();
    router.push(tab === "accommodation" ? `${href(locale, "/")}${qs ? `?${qs}` : ""}#alojamientos` : `${href(locale, "/ofertas")}${qs ? `?${qs}` : ""}`);
  }

  return (
    <section className="hero-salar" style={{ backgroundImage: `linear-gradient(90deg,rgba(33,63,59,.78) 0%,rgba(33,63,59,.45) 45%,rgba(33,63,59,.1) 75%),linear-gradient(180deg,rgba(33,63,59,.35) 0%,rgba(33,63,59,0) 40%,rgba(33,63,59,.4) 100%),url('${HERO_IMAGE}')` }}>
      <div className="shell hero-salar-inner">
        <div className="hero-salar-copy">
          <h1>{home.title} <em>{home.titleEm}</em></h1>
          <p>{home.lead}</p>
        </div>

        <div className="search-card">
          <div className="search-tabs" role="tablist" aria-label={dict.nav.offers}>
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`search-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
                <span className="search-tab-icon"><BrandIcon name={item.icon} size={24} /></span>
                <span className="search-tab-text"><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            ))}
          </div>
          <form className="hub-search" onSubmit={submit}>
            <label className="hub-box hub-destination"><MapPin size={19} /><span>{home.searchDestination}<SearchSuggest
              value={destination}
              onChange={(text) => { setDestination(text); setPlace(""); }}
              onPick={(item) => {
                if (item.kind === "offer") { router.push(href(locale, `/ofertas/${item.id}`)); return; }
                setDestination(item.label);
                setPlace(item.id);
              }}
              suggestions={suggestions}
              groupLabels={{ place: dict.nav.destinations, offer: dict.nav.offers }}
              placeholder={home.searchDestinationPlaceholder}
            /></span></label>
            <div className="hub-box hub-dates">
              <label><CalendarDays size={19} /><span>{home.searchCheckIn}<input type="date" min={today} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></span></label>
              <label><CalendarDays size={19} /><span>{home.searchCheckOut}<input type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></span></label>
            </div>
            <button className="hub-button"><Search size={20} /> {home.searchButton}</button>
          </form>
          <p className="hub-note"><span className="live-dot" /> {home.noteNew} <span className="note-divider" /> <ShieldCheck size={15} /> {home.noteVerified}</p>
        </div>
      </div>
      <span className="hero-salar-credit"><MapPin size={13} /> Salar de Uyuni, Potosí <small>{home.photoCredit}</small></span>
    </section>
  );
}
