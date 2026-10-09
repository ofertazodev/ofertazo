"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarCheck, Package, Users } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

type Tab = "overview" | "bookings" | "offers" | "applications";
type Attribution = { utm_source?: string; utm_campaign?: string; utm_content?: string; referrer?: string };

function hostname(url: string | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function OverviewPanel({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [metrics, setMetrics] = useState({ offers: 0, pending: 0, bookings: 0, applications: 0, users: 0 });
  const [sources, setSources] = useState<[string, number][]>([]);
  const [contents, setContents] = useState<[string, number][]>([]);
  const [offersByBookings, setOffersByBookings] = useState<[string, number][]>([]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    void (async () => {
      const [offers, bookings, pending, applications, users, recent] = await Promise.all([
        client.from("offers").select("id", { count: "exact", head: true }).eq("is_published", true),
        client.from("bookings").select("id", { count: "exact", head: true }),
        client.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        client.from("provider_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
        client.from("profiles").select("id", { count: "exact", head: true }),
        client.from("bookings").select("attribution,booking_items(title_snapshot)").order("created_at", { ascending: false }).limit(500)
      ]);
      setMetrics({ offers: offers.count ?? 0, bookings: bookings.count ?? 0, pending: pending.count ?? 0, applications: applications.count ?? 0, users: users.count ?? 0 });
      const rows = (recent.data ?? []) as { attribution: Attribution; booking_items: { title_snapshot: string }[] }[];
      setSources(countBy(rows, (row) => row.attribution?.utm_source ?? hostname(row.attribution?.referrer) ?? "directo"));
      setContents(countBy(rows.filter((row) => row.attribution?.utm_content || row.attribution?.utm_campaign), (row) => [row.attribution.utm_source, row.attribution.utm_campaign, row.attribution.utm_content].filter(Boolean).join(" / ")).slice(0, 10));
      setOffersByBookings(countBy(rows, (row) => row.booking_items[0]?.title_snapshot ?? "—").slice(0, 10));
    })();
  }, []);

  const cards = [
    { label: "Solicitudes por gestionar", value: metrics.pending, icon: CalendarCheck, tab: "bookings" as Tab, highlight: metrics.pending > 0 },
    { label: "Reservas totales", value: metrics.bookings, icon: CalendarCheck, tab: "bookings" as Tab },
    { label: "Ofertas publicadas", value: metrics.offers, icon: Package, tab: "offers" as Tab },
    { label: "Proveedores nuevos", value: metrics.applications, icon: BriefcaseBusiness, tab: "applications" as Tab, highlight: metrics.applications > 0 },
    { label: "Usuarios registrados", value: metrics.users, icon: Users, tab: "overview" as Tab }
  ];

  return (
    <>
      <div className="admin-heading"><div><p className="eyebrow warm">CENTRO DE CONTROL</p><h1>Panel <em>admin.</em></h1></div></div>
      <div className="admin-metrics">
        {cards.map(({ label, value, icon: Icon, tab, highlight }) => (
          <button className={`admin-metric ${highlight ? "highlight" : ""}`} key={label} onClick={() => onNavigate(tab)}><Icon size={20} /><span>{label}</span><strong>{value}</strong></button>
        ))}
      </div>
      <div className="admin-grid three">
        <section className="admin-panel-card">
          <p className="eyebrow warm">ORIGEN DE LAS RESERVAS</p>
          <h2>Por canal</h2>
          <RankList rows={sources} empty="Aún no hay reservas." />
        </section>
        <section className="admin-panel-card">
          <p className="eyebrow warm">CONTENIDO QUE VENDE</p>
          <h2>Por campaña / video</h2>
          <RankList rows={contents} empty="Usa el generador de enlaces (pestaña Ofertas) en cada video para ver aquí cuál trae reservas." />
        </section>
        <section className="admin-panel-card">
          <p className="eyebrow warm">OFERTAS</p>
          <h2>Más reservadas</h2>
          <RankList rows={offersByBookings} empty="Aún no hay reservas." />
        </section>
      </div>
      <p className="muted admin-footnote">Las visitas, clics y páginas vistas se consultan en Google Analytics (eventos view_item, click_whatsapp, begin_checkout, generate_lead...). Aquí ves solo las reservas reales.</p>
    </>
  );
}

function RankList({ rows, empty }: { rows: [string, number][]; empty: string }) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;
  const max = rows[0][1];
  return (
    <ul className="rank-list">
      {rows.map(([label, value]) => <li key={label}><span>{label}</span><b>{value}</b><i style={{ width: `${(value / max) * 100}%` }} /></li>)}
    </ul>
  );
}
