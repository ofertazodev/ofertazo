"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Compass, ExternalLink, Heart, MapPin, Menu, Search, ShieldCheck, Sparkles, Star, Users, X } from "lucide-react";
import { offers, type Offer } from "@/lib/offers";
import { supabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const filters = ["Todo", "Alojamiento", "Tour", "Paquete"] as const;
type Filter = (typeof filters)[number];
type Modal = "login" | "provider" | "dates" | "travelers" | "offer" | "checkout" | "success" | null;
type AuthMode = "login" | "signup";
const ADMIN_EMAIL = "ofertazodev@gmail.com";
type PublishedOfferRow = { id: string; title: string; original_price_minor: number; promotional_price_minor: number; currency_code: string; starts_at: string | null; ends_at: string | null; product: { title: string; description: string; duration_label: string | null; type: "accommodation" | "tour" | "package"; rating: number; review_count: number; destination: { name: string; address: string | null; latitude: number | null; longitude: number | null } | null; product_media: { public_url: string | null }[] } | null };

const heroSlides = [
  { place: "Salar de Uyuni", region: "Potosi", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg/1280px-Reflection_on_the_Salar_de_Uyuni%2C_bolivia.jpg" },
  { place: "Lago Titicaca", region: "La Paz", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Bolivia_-_On_the_shores_of_Lake_Titicaca.jpg/1280px-Bolivia_-_On_the_shores_of_Lake_Titicaca.jpg" },
  { place: "Parque Madidi", region: "La Paz - Beni", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Parque_Nacional_Madidi_-_La_Paz_-_Bolivia_10.png/1280px-Parque_Nacional_Madidi_-_La_Paz_-_Bolivia_10.png" },
  { place: "Torotoro", region: "Potosi", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Canyon_of_Torotoro.jpg/1280px-Canyon_of_Torotoro.jpg" }
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(value);
}

function OfferCard({ offer, favorite, onFavorite, onOpen }: { offer: Offer; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  const discount = Math.round((1 - offer.price / offer.previousPrice) * 100);
  const savings = offer.previousPrice - offer.price;

  return (
    <article className="offer-card">
      <div className="offer-image" style={{ backgroundImage: `url(${offer.image})` }}>
        <div className="offer-topline">
          <span className={`pill ${offer.flash ? "pill-flash" : ""}`}>{offer.flash ? `FLASH · -${discount}%` : `AHORRA -${discount}%`}</span>
          <button className="icon-button light" aria-label={`Guardar ${offer.title}`} onClick={onFavorite}><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button>
        </div>
        <span className="image-location"><MapPin size={14} /> {offer.destination}</span>
      </div>
      <div className="offer-content">
        <div className="offer-meta"><span>{offer.category}</span><span className="rating"><Star size={14} fill="currentColor" /> {offer.rating} <small>({offer.reviews})</small></span></div>
        <h3>{offer.title}</h3><p>{offer.includes}</p>
        <div className="offer-bottom"><div><span className="old-price">Antes {formatPrice(offer.previousPrice)}</span><strong>{formatPrice(offer.price)}</strong><small> / {offer.duration}</small><span className="savings">Te ahorras {formatPrice(savings)}</span></div><button className="arrow-button" aria-label={`Ver ${offer.title}`} onClick={onOpen}><ArrowRight size={18} /></button></div>
      </div>
    </article>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Cerrar" onClick={onClose}><X size={19} /></button>{children}</section></div>;
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<Filter>("Todo");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(2);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [providerDone, setProviderDone] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authMessage, setAuthMessage] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [catalogOffers, setCatalogOffers] = useState(offers);

  const filteredOffers = useMemo(() => catalogOffers.filter((offer) => {
    const matchesFilter = activeFilter === "Todo" || offer.category === activeFilter;
    const normalizedQuery = query.toLowerCase();
    return matchesFilter && (!normalizedQuery || `${offer.title} ${offer.destination}`.toLowerCase().includes(normalizedQuery));
  }), [activeFilter, catalogOffers, query]);

  const scrollToOffers = () => document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth" });
  const openOffer = (offer: Offer) => { setSelectedOffer(offer); setModal("offer"); };
  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const submitBooking = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setModal("success"); };
  const submitProvider = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setProviderDone(true); };
  const startCheckout = () => { if (user) setModal("checkout"); else { setAuthMode("signup"); setAuthMessage("Crea tu cuenta para continuar con la reserva."); setModal("login"); } };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) { setAuthMessage("Configura las variables de Supabase para activar la autenticacion."); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const result = authMode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setAuthMessage(result.error.message); return; }
    if (authMode === "signup" && !result.data.session) { setAuthMessage("Revisa tu correo para confirmar la cuenta y luego inicia sesion."); return; }
    setAuthMessage("");
    if (email.toLowerCase() === ADMIN_EMAIL) { window.location.assign("/admin"); return; }
    setModal(selectedOffer ? "checkout" : null);
  };
  const signInWithGoogle = async () => {
    if (!supabase) { setAuthMessage("Configura las variables de Supabase para activar la autenticacion."); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setAuthMessage(error.message);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.from("offers").select("id,title,original_price_minor,promotional_price_minor,currency_code,starts_at,ends_at,product:products(title,description,duration_label,type,rating,review_count,destination:destinations(name,address,latitude,longitude),product_media(public_url))").eq("is_published", true).then(({ data }) => {
      const rows = (data ?? []) as unknown as PublishedOfferRow[];
      if (rows.length > 0) setCatalogOffers([...rows.map((row): Offer => ({ id: row.id, title: row.product?.title || row.title, destination: row.product?.destination?.name || "Bolivia", category: row.product?.type === "accommodation" ? "Alojamiento" : row.product?.type === "package" ? "Paquete" : "Tour", price: Math.round(row.promotional_price_minor / 100), previousPrice: Math.round(row.original_price_minor / 100), duration: row.product?.duration_label || "Experiencia", rating: Number(row.product?.rating || 0), reviews: row.product?.review_count || 0, includes: row.product?.description || "Oferta publicada en Ofertazo", image: row.product?.product_media?.find((media) => media.public_url)?.public_url || offers[0].image, latitude: row.product?.destination?.latitude ?? undefined, longitude: row.product?.destination?.longitude ?? undefined, address: row.product?.destination?.address ?? undefined, flash: Boolean(row.ends_at) })), ...offers]);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email?.toLowerCase() === ADMIN_EMAIL) window.location.assign("/admin");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser?.email?.toLowerCase() === ADMIN_EMAIL) window.location.assign("/admin");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (carouselPaused) return;
    const interval = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(interval);
  }, [carouselPaused]);

  return (
    <main>
      <nav className="navbar shell">
        <a className="brand" href="#inicio" aria-label="Ofertazo inicio"><span className="brand-mark">O</span><span>ofertazo<span className="brand-dot">.</span></span></a>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#ofertas" onClick={() => setMenuOpen(false)}>Ofertas</a><a href="#destinos" onClick={() => setMenuOpen(false)}>Destinos</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a>
        </div>
        <div className="nav-actions"><button className="ghost-button" onClick={() => { setAuthMode("login"); setAuthMessage(""); setModal("login"); }}>{user ? user.email : "Iniciar sesion"}</button><button className="nav-cta" onClick={() => { setProviderDone(false); setModal("provider"); }}>Publicar oferta <ArrowRight size={16} /></button><button className="menu-button" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
      </nav>

      <section className="hero" id="inicio" aria-label={`Destino destacado: ${heroSlides[activeSlide].place}`} onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}><div className="hero-wash" style={{ backgroundImage: `linear-gradient(100deg,rgba(199,216,203,.86) 0%,rgba(199,216,203,.42) 51%,rgba(33,63,59,.18) 100%),url('${heroSlides[activeSlide].image}')` }} /><div className="hero-slide-label"><MapPin size={14} /> {heroSlides[activeSlide].place}, {heroSlides[activeSlide].region} <small>Foto: Wikimedia Commons</small></div><div className="shell hero-inner"><div className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> VIAJES QUE SI DAN GANAS</p><h1>Tu proximo gran plan <em>empieza aqui.</em></h1><p className="hero-lead">Escapadas, hoteles y experiencias seleccionadas para viajar mejor, sin pagar de mas.</p></div>
        <div className="search-panel"><div className="search-field"><MapPin size={19} /><label>Destino<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A donde quieres ir?" /></label></div><button className="search-field desktop-field search-select" onClick={() => setModal("dates")}><CalendarDays size={19} /><label>Fechas<span>{dates.start && dates.end ? `${dates.start} - ${dates.end}` : "Elige tus fechas"}</span></label><ChevronDown size={16} /></button><button className="search-field desktop-field search-select" onClick={() => setModal("travelers")}><Users size={19} /><label>Viajeros<span>{travelers} viajeros</span></label><ChevronDown size={16} /></button><button className="search-button" aria-label="Buscar ofertas" onClick={scrollToOffers}><Search size={20} /><span>Buscar</span></button></div>
        <div className="hero-note"><span className="live-dot" /> Nuevas ofertas cada semana <span className="note-divider" /> <ShieldCheck size={15} /> Proveedores verificados</div></div></section>

      <section className="section shell" id="ofertas"><div className="discount-banner"><div className="discount-burst">%</div><div><strong>El precio que estabas esperando.</strong><span>Ofertas reales, hasta 30% menos en escapadas seleccionadas.</span></div><button onClick={() => setActiveFilter("Todo")}>Ver ofertas <ArrowRight size={16} /></button></div><div className="section-heading"><div><p className="eyebrow warm">SELECCION DEL EQUIPO</p><h2>Ofertazos para salir <em>de la rutina.</em></h2></div><button className="text-link" onClick={() => { setQuery(""); setActiveFilter("Todo"); scrollToOffers(); }}>Ver todos <ArrowRight size={17} /></button></div>
        <div className="filter-row">{filters.map((filter) => <button key={filter} className={`filter-button ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div><div className="offer-grid">{filteredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} favorite={favorites.includes(offer.id)} onFavorite={() => toggleFavorite(offer.id)} onOpen={() => openOffer(offer)} />)}</div>{filteredOffers.length === 0 && <div className="empty-state"><Search size={22} /><p>No encontramos ofertas con ese destino.</p><button className="dark-button" onClick={() => setQuery("")}>Ver todas las ofertas</button></div>}
      </section>

      <section className="split-banner shell" id="destinos"><div className="split-image" /><div className="split-copy"><p className="eyebrow warm">PARA TU PROXIMA ESCAPADA</p><h2>Hay un lugar que todavia no has <em>descubierto.</em></h2><p>Desde la calma del lago hasta la fuerza del altiplano. Encuentra una forma distinta de conocer Bolivia.</p><button className="dark-button" onClick={scrollToOffers}>Explorar destinos <ArrowRight size={17} /></button></div></section>
      <section className="trust-section" id="como-funciona"><div className="shell trust-inner"><div><p className="eyebrow warm">VIAJA CON CONFIANZA</p><h2>Todo claro antes<br /><em>de hacer las maletas.</em></h2></div><div className="trust-points"><div><ShieldCheck /><h3>Proveedores reales</h3><p>Trabajamos con negocios locales verificados.</p></div><div><Sparkles /><h3>Precios honestos</h3><p>Lo que ves es lo que pagas, sin sorpresas.</p></div><div><Compass /><h3>Planes con criterio</h3><p>Ofertas elegidas para que valga la pena ir.</p></div></div></div></section>
      <footer className="footer"><div className="shell footer-inner"><a className="brand inverse" href="#inicio"><span className="brand-mark">O</span><span>ofertazo<span className="brand-dot">.</span></span></a><p>El viaje que querias, al precio que esperabas.</p><span className="footer-small">Bolivia · 2026</span></div></footer>

      {modal === "login" && <ModalShell title={authMode === "signup" ? "Crear cuenta" : "Iniciar sesion"} onClose={() => setModal(null)}><p className="modal-kicker">TU CUENTA OFERTAZO</p><h2>{authMode === "signup" ? "Reserva tu proximo plan." : "Vuelve a tus planes."}</h2><p className="modal-copy">{authMode === "signup" ? "Necesitamos tu correo para guardar la reserva y enviarte la confirmacion." : "Accede para continuar con tu reserva."}</p><button className="google-button" onClick={signInWithGoogle}><span className="google-mark">G</span> Continuar con Google</button><div className="auth-divider"><span>o usa tu correo</span></div><form className="modal-form" onSubmit={submitAuth}><label>Email<input name="email" type="email" required placeholder="tu@email.com" /></label><label>Contrasena<input name="password" type="password" minLength={6} required placeholder="Minimo 6 caracteres" /></label>{authMessage && <p className="form-message">{authMessage}</p>}<button className="dark-button form-button">{authMode === "signup" ? "Crear cuenta" : "Entrar a mi cuenta"} <ArrowRight size={17} /></button></form><button className="modal-secondary" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthMessage(""); }}>{authMode === "signup" ? "Ya tengo una cuenta" : "Crear una cuenta nueva"}</button><button className="modal-secondary" onClick={() => setModal(null)}>Seguir explorando sin iniciar sesion</button></ModalShell>}

      {modal === "provider" && <ModalShell title="Publicar oferta" onClose={() => setModal(null)}>{providerDone ? <div className="success-content"><span className="success-icon"><ShieldCheck /></span><p className="modal-kicker">SOLICITUD RECIBIDA</p><h2>Tu oferta esta en camino.</h2><p className="modal-copy">Un asesor revisaria los datos y te contactaria para completar el alta del proveedor.</p><button className="dark-button form-button" onClick={() => setModal(null)}>Volver al inicio <ArrowRight size={17} /></button></div> : <><p className="modal-kicker">PARA PROVEEDORES</p><h2>Comparte tu mejor oferta.</h2><p className="modal-copy">Prueba el flujo de alta. Todavia no envia datos a ningun servidor.</p><form className="modal-form" onSubmit={submitProvider}><label>Nombre del negocio<input required placeholder="Hotel, agencia o experiencia" /></label><label>Tu email<input type="email" required placeholder="contacto@negocio.com" /></label><label>Cuéntanos qué ofreces<textarea required placeholder="Describe brevemente tu oferta" /></label><button className="dark-button form-button">Enviar solicitud <ArrowRight size={17} /></button></form></>}</ModalShell>}

      {modal === "dates" && <ModalShell title="Seleccionar fechas" onClose={() => setModal(null)}><p className="modal-kicker">PLANIFICA TU ESCAPADA</p><h2>¿Cuándo quieres viajar?</h2><div className="modal-form"><label>Desde<input type="date" value={dates.start} onChange={(event) => setDates({ ...dates, start: event.target.value })} /></label><label>Hasta<input type="date" value={dates.end} onChange={(event) => setDates({ ...dates, end: event.target.value })} /></label><button className="dark-button form-button" onClick={() => setModal(null)}>Guardar fechas <ArrowRight size={17} /></button></div></ModalShell>}

      {modal === "travelers" && <ModalShell title="Seleccionar viajeros" onClose={() => setModal(null)}><p className="modal-kicker">DETALLES DEL VIAJE</p><h2>¿Cuántos viajan?</h2><div className="stepper"><button aria-label="Quitar viajero" onClick={() => setTravelers(Math.max(1, travelers - 1))}>−</button><strong>{travelers}</strong><button aria-label="Agregar viajero" onClick={() => setTravelers(Math.min(12, travelers + 1))}>+</button></div><button className="dark-button form-button" onClick={() => setModal(null)}>Guardar viajeros <ArrowRight size={17} /></button></ModalShell>}

      {modal === "offer" && selectedOffer && <ModalShell title={selectedOffer.title} onClose={() => setModal(null)}><div className="detail-image" style={{ backgroundImage: `url(${selectedOffer.image})` }} /><p className="modal-kicker">{selectedOffer.category} · {selectedOffer.destination}</p><h2>{selectedOffer.title}</h2><div className="detail-rating"><Star size={15} fill="currentColor" /> {selectedOffer.rating} · {selectedOffer.reviews} opiniones</div><p className="modal-copy">{selectedOffer.includes}. Una experiencia seleccionada para que tengas todo claro antes de reservar.</p>{selectedOffer.latitude !== undefined && selectedOffer.longitude !== undefined && <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${selectedOffer.latitude},${selectedOffer.longitude}`} target="_blank" rel="noreferrer"><MapPin size={16} /> Ver ubicación en Google Maps <ExternalLink size={14} /></a>}<div className="detail-price"><div><span>Desde</span><strong>{formatPrice(selectedOffer.price)}</strong><small> / {selectedOffer.duration}</small></div><button className="dark-button" onClick={startCheckout}>Reservar ahora <ArrowRight size={17} /></button></div></ModalShell>}

      {modal === "checkout" && selectedOffer && <ModalShell title="Completar reserva" onClose={() => setModal(null)}><button className="back-link" onClick={() => setModal("offer")}><ArrowLeft size={16} /> Volver a la oferta</button><p className="modal-kicker">RESERVA DE PRUEBA</p><h2>Un ultimo paso.</h2><p className="modal-copy">Estás reservando <strong>{selectedOffer.title}</strong> para {travelers} viajeros.</p><form className="modal-form" onSubmit={submitBooking}><label>Nombre completo<input required value={bookingName} onChange={(event) => setBookingName(event.target.value)} placeholder="Tu nombre" /></label><label>Email de confirmacion<input required type="email" value={bookingEmail} onChange={(event) => setBookingEmail(event.target.value)} placeholder="tu@email.com" /></label><label className="check-row"><input type="checkbox" required /> Acepto las condiciones de reserva de esta demo.</label><button className="dark-button form-button">Confirmar reserva <ArrowRight size={17} /></button></form></ModalShell>}

      {modal === "success" && selectedOffer && <ModalShell title="Reserva confirmada" onClose={() => setModal(null)}><div className="success-content"><span className="success-icon"><Sparkles /></span><p className="modal-kicker">RESERVA CONFIRMADA</p><h2>Ya tienes plan, {bookingName.split(" ")[0] || "viajero"}.</h2><p className="modal-copy">Tu solicitud para <strong>{selectedOffer.title}</strong> quedó registrada en esta demo. En la versión real recibirías un email en {bookingEmail}.</p><button className="dark-button form-button" onClick={() => setModal(null)}>Seguir explorando <ArrowRight size={17} /></button></div></ModalShell>}
    </main>
  );
}
