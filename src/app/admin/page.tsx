"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BriefcaseBusiness, CalendarCheck, ExternalLink, LogOut, MapPin, Package, ShieldAlert } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ApplicationsPanel } from "@/components/admin/ApplicationsPanel";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { DestinationsPanel } from "@/components/admin/DestinationsPanel";
import { OffersPanel } from "@/components/admin/OffersPanel";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { supabase } from "@/lib/supabase-browser";
import { LlamaLoader, TripyaLogo } from "@/components/site/TripyaLogo";

type Tab = "overview" | "bookings" | "offers" | "destinations" | "applications";

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "Resumen", icon: BarChart3 },
  { id: "bookings", label: "Reservas", icon: CalendarCheck },
  { id: "offers", label: "Ofertas", icon: Package },
  { id: "destinations", label: "Destinos", icon: MapPin },
  { id: "applications", label: "Proveedores", icon: BriefcaseBusiness }
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!supabase) { setMessage("Supabase no está configurado en este entorno."); setLoading(false); return; }
    const client = supabase;
    async function check(nextUser: User | null) {
      setUser(nextUser);
      if (!nextUser) { setAllowed(false); setLoading(false); return; }
      const { data, error } = await client.from("user_roles").select("role").eq("user_id", nextUser.id);
      const hasAccess = !error && Boolean(data?.some(({ role }) => ["admin", "superadmin", "finance_admin"].includes(role)));
      setAllowed(hasAccess);
      setMessage(hasAccess ? "" : "Tu cuenta todavía no tiene un rol administrativo.");
      setLoading(false);
    }
    void client.auth.getUser().then(({ data }) => check(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { void check(session?.user ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (error) setMessage(error.message);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <main className="admin-page"><LlamaLoader size="lg" label="Cargando panel..." /></main>;

  if (!user) return (
    <main className="admin-page">
      <form className="admin-gate" onSubmit={signIn}>
        <ShieldAlert size={38} />
        <p className="modal-kicker">PANEL ADMINISTRATIVO</p>
        <h1>Inicia sesión para continuar.</h1>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        {message && <p className="form-message">{message}</p>}
        <button className="dark-button">Entrar</button>
        <Link className="text-link" href="/">Volver al sitio</Link>
      </form>
    </main>
  );

  if (!allowed) return (
    <main className="admin-page">
      <div className="admin-gate">
        <ShieldAlert size={38} />
        <p className="modal-kicker">ACCESO RESTRINGIDO</p>
        <h1>Tu cuenta no es administradora.</h1>
        <p>{message}</p>
        <button className="dark-button" onClick={signOut}>Cerrar sesión <LogOut size={16} /></button>
      </div>
    </main>
  );

  return (
    <main className="admin-page">
      <nav className="admin-nav shell">
        <Link className="brand" href="/" aria-label="Tripya"><TripyaLogo className="brand-logo" /></Link>
        <div className="admin-nav-actions">
          <Link href="/es" target="_blank" className="admin-action-link"><ExternalLink size={15} /> Ver sitio</Link>
          <span className="desktop-only">{user.email}</span>
          <button onClick={signOut} aria-label="Cerrar sesión"><LogOut size={17} /></button>
        </div>
      </nav>
      <section className="shell admin-content">
        <div className="admin-tabs" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={16} /> {label}</button>)}
        </div>
        {tab === "overview" && <OverviewPanel onNavigate={setTab} />}
        {tab === "bookings" && <BookingsPanel />}
        {tab === "offers" && <OffersPanel user={user} />}
        {tab === "destinations" && <DestinationsPanel />}
        {tab === "applications" && <ApplicationsPanel />}
      </section>
    </main>
  );
}
