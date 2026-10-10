"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { BrandIcon, type BrandIconName } from "@/components/site/BrandIcons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { todayInBolivia } from "@/lib/dates";
import type { ProductType } from "@/lib/listing";

const heroSlides = [
  { place: "Salar de Uyuni", region: "Potosí", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg/1280px-Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg" },
  { place: "Lago Titicaca", region: "La Paz", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Bolivia_-_On_the_shores_of_Lake_Titicaca.jpg/1280px-Bolivia_-_On_the_shores_of_Lake_Titicaca.jpg" },
  { place: "Parque Madidi", region: "La Paz - Beni", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Parque_Nacional_Madidi_-_La_Paz_-_Bolivia_10.png/1280px-Parque_Nacional_Madidi_-_La_Paz_-_Bolivia_10.png" },
  { place: "Torotoro", region: "Potosí", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Canyon_of_Torotoro.jpg/1280px-Canyon_of_Torotoro.jpg" }
];

/** Search tabs change what "Buscar" looks for; link tabs just navigate. */
type Category =
  | { kind: "search"; id: ProductType; label: string; icon: BrandIconName }
  | { kind: "link"; id: string; label: string; icon: BrandIconName; path: string };

export function HeroSearch({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const home = dict.home;
  const router = useRouter();
  const [category, setCategory] = useState<ProductType>("accommodation");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [today, setToday] = useState<string>();

  useEffect(() => { setToday(todayInBolivia()); }, []);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  const categories: Category[] = [
    { kind: "search", id: "accommodation", label: home.tabAccommodations, icon: "bed" },
    { kind: "search", id: "package", label: home.tabPackages, icon: "backpack" },
    { kind: "search", id: "tour", label: home.tabTours, icon: "mountain" },
    { kind: "link", id: "flash", label: dict.nav.flash, icon: "bolt", path: "/ofertas?flash=1" },
    { kind: "link", id: "all", label: home.tabAll, icon: "tag", path: "/ofertas" },
    { kind: "link", id: "destinations", label: dict.nav.destinations, icon: "pin", path: "/destinos" }
  ];
  const current = categories.find((item) => item.kind === "search" && item.id === category);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (checkIn) params.set("in", checkIn);
    if (checkOut) params.set("out", checkOut);
    if (guests) params.set("g", guests);
    track("search", { search_term: destination.trim(), guests: Number(guests) || undefined });
    // Accommodations are searched on the home page itself; the rest in the full offer list.
    if (category !== "accommodation") params.set("categoria", category);
    const qs = params.toString();
    router.push(category === "accommodation" ? `${href(locale, "/")}${qs ? `?${qs}` : ""}#alojamientos` : `${href(locale, "/ofertas")}?${qs}`);
  }

  const slide = heroSlides[active];
  const go = (step: number) => setActive((index) => (index + step + heroSlides.length) % heroSlides.length);

  return (
    <>
      <section className="hub">
        <div className="shell">
          <nav className="hub-tabs" aria-label={dict.nav.offers}>
            {categories.map((item) => {
              const content = <><span className="hub-tab-icon"><BrandIcon name={item.icon} size={28} /></span><span>{item.label}</span></>;
              return item.kind === "search"
                ? <button key={item.id} type="button" className={`hub-tab ${item.id === category ? "active" : ""}`} aria-pressed={item.id === category} onClick={() => setCategory(item.id)}>{content}</button>
                : <Link key={item.id} className="hub-tab" href={href(locale, item.path)}>{content}</Link>;
            })}
          </nav>

          <h1 className="hub-title">{current?.label}</h1>
          <form className="hub-search" onSubmit={submit}>
            <label className="hub-box hub-destination"><MapPin size={19} /><span>{home.searchDestination}<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={home.searchDestinationPlaceholder} /></span></label>
            <div className="hub-box hub-dates">
              <label><CalendarDays size={19} /><span>{home.searchCheckIn}<input type="date" min={today} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></span></label>
              <label><CalendarDays size={19} /><span>{home.searchCheckOut}<input type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></span></label>
            </div>
            <label className="hub-box hub-guests"><Users size={19} /><span>{home.searchGuests}<input type="number" min={1} max={50} value={guests} onChange={(event) => setGuests(event.target.value)} /></span></label>
            <button className="hub-button"><Search size={20} /> {home.searchButton}</button>
          </form>
          <p className="hub-note"><span className="live-dot" /> {home.noteNew} <span className="note-divider" /> <ShieldCheck size={15} /> {home.noteVerified}</p>
        </div>
      </section>

      <section className="shell hub-banner" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="hub-banner-image" style={{ backgroundImage: `linear-gradient(90deg,rgba(23,35,43,.78) 0%,rgba(23,35,43,.35) 55%,rgba(23,35,43,.05) 100%),url('${slide.image}')` }} />
        <div className="hub-banner-copy">
          <p className="eyebrow">{home.eyebrow}</p>
          <h2>{home.title} <em>{home.titleEm}</em></h2>
          <p>{home.lead}</p>
        </div>
        <span className="hub-banner-place"><MapPin size={14} /> {slide.place}, {slide.region} <small>{home.photoCredit}</small></span>
        <button className="hub-arrow prev" aria-label={home.slidePrev} onClick={() => go(-1)}><ChevronLeft size={20} /></button>
        <button className="hub-arrow next" aria-label={home.slideNext} onClick={() => go(1)}><ChevronRight size={20} /></button>
        <div className="hub-dots">{heroSlides.map((item, index) => <button key={item.place} className={index === active ? "active" : ""} aria-label={item.place} aria-current={index === active} onClick={() => setActive(index)} />)}</div>
      </section>
    </>
  );
}
