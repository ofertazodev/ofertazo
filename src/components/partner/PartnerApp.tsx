"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BedDouble, Building2, ChevronRight, Home, LogOut, Map, MessageCircle, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import { KIND_LABELS, LISTING_SELECT, LISTING_STATUS, type ListingKind, type PartnerListing, type PartnerProfile } from "@/lib/partner";
import { whatsappUrl } from "@/lib/whatsapp";
import { LlamaLoader, TripyaLogo } from "@/components/site/TripyaLogo";
import { ListingEditor } from "./ListingEditor";
import { PartnerLlama } from "./PartnerLlama";

type Screen = { name: "home" } | { name: "new" } | { name: "listing"; id: string };

const KIND_ICONS: Record<ListingKind, typeof Home> = { hotel: Building2, apartment: Home, package: Map };
const KIND_HINTS: Record<ListingKind, string> = {
  hotel: "Hoteles, hostales y lodges: dibuja tus pisos y habitaciones.",
  apartment: "Un departamento, casa o cabaña que se alquila completo.",
  package: "Paquetes, tours y circuitos de empresas de turismo."
};
const suggestedKind = (partnerType: string): ListingKind => (partnerType === "owner" ? "apartment" : partnerType === "agency" || partnerType === "tour_operator" ? "package" : "hotel");

/** /socios: login → access check (only partners registered by an admin) → the partner's panel. */
export function PartnerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [partners, setPartners] = useState<PartnerProfile[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const client = supabase;
    async function check(nextUser: User | null) {
      setUser(nextUser);
      if (!nextUser) { setPartners(null); setLoading(false); return; }
      const { data } = await client.rpc("partner_me");
      setPartners(Array.isArray(data) ? (data as PartnerProfile[]) : []);
      setLoading(false);
    }
    void client.auth.getUser().then(({ data }) => check(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { void check(session?.user ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="partner-page"><LlamaLoader size="lg" label="Cargando tu panel..." /></main>;
  if (!user) return <PartnerLogin />;
  if (!partners || partners.length === 0) return <NotPartner email={user.email ?? ""} />;
  return <PartnerShell user={user} partner={partners[0]} />;
}

function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/socios` } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : result.error.message); return; }
    if (mode === "signup" && !result.data.session) setMessage("Te enviamos un correo para confirmar tu cuenta. Confírmalo y vuelve a entrar.");
  }

  async function google() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/socios` } });
    if (error) setMessage(error.message);
  }

  return (
    <main className="partner-page partner-gate-page">
      <div className="partner-gate">
        <TripyaLogo className="brand-logo" />
        <PartnerLlama size="lg" message={<><strong>¡Hola, socio!</strong> Entra con el email que registraste con el equipo de Tripya.</>} />
        <p className="modal-kicker">PANEL DE SOCIOS</p>
        <h1>{mode === "login" ? "Entra a tu panel" : "Crea tu acceso"}</h1>
        <button type="button" className="google-button" onClick={() => void google()}><span className="google-mark">G</span> Continuar con Google</button>
        <div className="auth-divider"><span>o usa tu email</span></div>
        <form className="partner-login" onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Contraseña<input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo 8 caracteres" /></label>
          {message && <p className="form-message">{message}</p>}
          <button className="dark-button cta form-button" disabled={busy}>{mode === "login" ? "Entrar" : "Crear mi acceso"} <ArrowRight size={17} /></button>
        </form>
        <button type="button" className="modal-secondary" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "¿Primera vez? Crea tu acceso con el email que nos diste" : "Ya tengo acceso, quiero entrar"}
        </button>
        <Link className="text-link" href="/">Volver a Tripya</Link>
      </div>
    </main>
  );
}

function NotPartner({ email }: { email: string }) {
  const link = whatsappUrl(`Hola Tripya, quiero acceder al panel de socios con el email ${email}.`);
  return (
    <main className="partner-page partner-gate-page">
      <div className="partner-gate">
        <TripyaLogo className="brand-logo" />
        <PartnerLlama size="lg" message={<>Todavía no encuentro tu cuenta entre nuestros socios.</>} />
        <h1>Tu cuenta aún no está registrada como socio</h1>
        <p className="muted">Este panel es solo para hoteles, dueños de alojamientos y empresas de turismo que trabajan con Tripya. Si ya hablaste con nuestro equipo, pídenos que registremos el email <b>{email}</b>.</p>
        {link && <a className="whatsapp-button whatsapp-block" href={link} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Escribir a Tripya por WhatsApp</a>}
        <button className="modal-secondary" onClick={() => void supabase?.auth.signOut()}>Entrar con otra cuenta</button>
      </div>
    </main>
  );
}

function PartnerShell({ user, partner }: { user: User; partner: PartnerProfile }) {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [listings, setListings] = useState<PartnerListing[] | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("partner_listings").select(LISTING_SELECT).eq("provider_id", partner.id).order("updated_at", { ascending: false });
    setListings((data ?? []) as PartnerListing[]);
  }, [partner.id]);

  useEffect(() => { void load(); }, [load]);

  const go = (next: Screen) => { setScreen(next); window.scrollTo({ top: 0, behavior: "smooth" }); if (next.name === "home") void load(); };

  return (
    <main className="partner-page">
      <nav className="partner-nav shell">
        <button className="brand" onClick={() => go({ name: "home" })} aria-label="Inicio del panel"><TripyaLogo className="brand-logo" /></button>
        <span className="partner-nav-badge">Panel de socios</span>
        <div className="partner-nav-actions">
          <span className="desktop-only">{partner.trade_name}</span>
          <button onClick={() => void supabase?.auth.signOut()} aria-label="Cerrar sesión" title={user.email ?? ""}><LogOut size={17} /></button>
        </div>
      </nav>
      <section className="shell partner-content">
        {screen.name === "home" && <PartnerHome partner={partner} listings={listings} onOpen={(id) => go({ name: "listing", id })} onNew={() => go({ name: "new" })} />}
        {screen.name === "new" && <NewListing partner={partner} onCancel={() => go({ name: "home" })} onCreated={(id) => go({ name: "listing", id })} />}
        {screen.name === "listing" && <ListingEditor listingId={screen.id} partner={partner} onBack={() => go({ name: "home" })} />}
      </section>
    </main>
  );
}

function PartnerHome({ partner, listings, onOpen, onNew }: { partner: PartnerProfile; listings: PartnerListing[] | null; onOpen: (id: string) => void; onNew: () => void }) {
  const name = partner.contact_name?.split(/[ (]/)[0] || partner.trade_name;
  const pending = listings?.find((listing) => listing.status === "negotiating");
  const draft = listings?.find((listing) => listing.status === "draft");
  const tip = !listings ? "Un momento, estoy buscando tus alojamientos..."
    : listings.length === 0 ? "Empecemos registrando tu primer alojamiento o paquete. Te guío en cada paso."
    : pending ? `Tenemos una negociación abierta sobre «${pending.name}». Entra para ver los mensajes.`
    : draft ? `«${draft.name}» está en borrador. Completa sus fotos y envíanos tu oferta.`
    : "Todo al día. Puedes registrar otro alojamiento o paquete cuando quieras.";
  const steps = [
    { title: "Registra tu alojamiento", text: "Hotel, departamento o paquete turístico." },
    { title: "Sube fotos y datos", text: "Habitación por habitación, con lo que ofrece cada una." },
    { title: "Envíanos tu oferta", text: "Tu mejor precio para Tripya, fechas y beneficios." },
    { title: "Negociamos", text: "Si nos convence la publicamos; si no, lo hablamos por chat." }
  ];

  return (
    <>
      <div className="partner-hero">
        <PartnerLlama size="lg" message={<><strong>¡Hola, {name}!</strong> {tip}</>} />
        <div>
          <p className="eyebrow warm">{partner.trade_name}</p>
          <h1>Tu panel de <em>socio Tripya.</em></h1>
          <p className="muted">Aquí preparas tus alojamientos o paquetes y nos envías tus ofertas. Nada se publica sin que el equipo de Tripya lo revise y lo acepte.</p>
        </div>
      </div>
      <ol className="partner-steps">{steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.text}</small></div></li>)}</ol>

      <div className="partner-section-head">
        <h2>Mis alojamientos y paquetes</h2>
        <button className="dark-button" onClick={onNew}><Plus size={16} /> Registrar nuevo</button>
      </div>
      {!listings ? <LlamaLoader /> : listings.length === 0 ? (
        <button className="partner-empty" onClick={onNew}><BedDouble size={28} /><strong>Registra tu primer alojamiento o paquete</strong><span>Te tomará unos minutos.</span></button>
      ) : (
        <div className="partner-cards">
          {listings.map((listing) => {
            const Icon = KIND_ICONS[listing.kind];
            const status = LISTING_STATUS[listing.status];
            return (
              <button key={listing.id} className="partner-card" onClick={() => onOpen(listing.id)}>
                <span className="partner-card-icon"><Icon size={22} /></span>
                <span className="partner-card-body"><strong>{listing.name}</strong><small>{KIND_LABELS[listing.kind]}{listing.city_text ? ` · ${listing.city_text}` : ""}</small></span>
                <span className={`partner-chip ${status.tone}`}>{status.label}</span>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function NewListing({ partner, onCancel, onCreated }: { partner: PartnerProfile; onCancel: () => void; onCreated: (id: string) => void }) {
  const [kind, setKind] = useState<ListingKind>(suggestedKind(partner.partner_type));
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (name.trim().length < 2) { setError("Escribe el nombre."); return; }
    setBusy(true);
    const { data, error: insertError } = await supabase.from("partner_listings")
      .insert({ provider_id: partner.id, kind, name: name.trim(), city_text: partner.city, property_type: kind === "hotel" ? "hotel" : kind === "apartment" ? "apartment" : null })
      .select("id").single();
    if (insertError || !data) { setBusy(false); setError("No pudimos crearlo. Inténtalo de nuevo."); return; }
    // An apartment is a single unit: create it right away so the partner only fills its details.
    if (kind === "apartment") await supabase.from("partner_units").insert({ listing_id: data.id, floor: 1, label: "Unidad", room_type: "Alojamiento completo" });
    onCreated(data.id);
  }

  return (
    <form className="partner-new" onSubmit={create}>
      <PartnerLlama message={<>¿Qué quieres registrar? Elige el tipo y ponle nombre, después te pido los detalles.</>} />
      <div className="partner-kind-grid" role="radiogroup" aria-label="Tipo">
        {(Object.keys(KIND_LABELS) as ListingKind[]).map((value) => {
          const Icon = KIND_ICONS[value];
          return (
            <label key={value} className={`partner-kind ${kind === value ? "active" : ""}`}>
              <input type="radio" name="kind" checked={kind === value} onChange={() => setKind(value)} />
              <Icon size={30} /><strong>{KIND_LABELS[value]}</strong><small>{KIND_HINTS[value]}</small>
            </label>
          );
        })}
      </div>
      <label className="partner-field">{kind === "package" ? "Nombre del paquete o tour" : "Nombre del alojamiento"}
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder={kind === "package" ? "Ej. Circuito Salar de Uyuni 3 días" : "Ej. Hotel Mami Vilma"} />
      </label>
      {error && <p className="form-message">{error}</p>}
      <div className="partner-actions">
        <button type="button" className="ghost-button outlined" onClick={onCancel}>Cancelar</button>
        <button className="dark-button cta" disabled={busy}>Continuar <ArrowRight size={17} /></button>
      </div>
    </form>
  );
}
