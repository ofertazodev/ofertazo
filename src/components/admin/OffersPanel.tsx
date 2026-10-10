"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Link2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { formatMoney, money } from "@/lib/money";
import { supabase } from "@/lib/supabase-browser";
import { OfferForm } from "./OfferForm";

type OfferRow = {
  id: string;
  title: string;
  kind: "normal" | "flash";
  is_published: boolean;
  featured: boolean;
  original_price_minor: number;
  promotional_price_minor: number;
  currency_code: string;
  ends_at: string | null;
  product: { id: string; slug: string; title: string; type: string; is_published: boolean; verified_at: string | null; is_sample?: boolean; destination: { name: string } | null } | null;
};

const SOURCES = [
  { value: "tiktok", medium: "social", label: "TikTok" },
  { value: "instagram", medium: "social", label: "Instagram" },
  { value: "facebook", medium: "social", label: "Facebook" },
  { value: "whatsapp", medium: "messaging", label: "WhatsApp" },
  { value: "google", medium: "cpc", label: "Google Ads" }
];

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
}

export function OffersPanel({ user }: { user: User }) {
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [linkSlug, setLinkSlug] = useState("");
  const [linkSource, setLinkSource] = useState("tiktok");
  const [linkContent, setLinkContent] = useState("");
  const [linkLocale, setLinkLocale] = useState("es");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("offers")
      .select("id,title,kind,is_published,featured,original_price_minor,promotional_price_minor,currency_code,ends_at,product:products(*,destination:destinations(name))")
      .order("created_at", { ascending: false });
    if (error) { setMessage(error.message); return; }
    const list = (data ?? []) as unknown as OfferRow[];
    setRows(list);
    setLinkSlug((current) => current || list[0]?.product?.slug || "");
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function togglePublished(row: OfferRow) {
    if (!supabase || !row.product) return;
    const next = !row.is_published;
    const [offer, product] = await Promise.all([
      supabase.from("offers").update({ is_published: next }).eq("id", row.id),
      next ? supabase.from("products").update({ is_published: true }).eq("id", row.product.id) : Promise.resolve({ error: null })
    ]);
    setMessage(offer.error?.message ?? product.error?.message ?? (next ? "Oferta publicada." : "Oferta ocultada."));
    void load();
  }

  // Only sample offers can be deleted here: real ones may have bookings and are hidden instead.
  async function removeSample(row: OfferRow) {
    if (!supabase || !row.product?.is_sample) return;
    if (!window.confirm(`¿Eliminar la oferta de ejemplo «${row.product.title}»?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", row.product.id);
    setMessage(error?.message ?? "Oferta de ejemplo eliminada.");
    void load();
  }

  async function removeAllSamples() {
    if (!supabase) return;
    const ids = rows.filter((row) => row.product?.is_sample).map((row) => row.product!.id);
    if (!ids.length || !window.confirm(`¿Eliminar las ${ids.length} ofertas de ejemplo? Las ofertas reales no se tocan.`)) return;
    const { error } = await supabase.from("products").delete().in("id", ids);
    setMessage(error?.message ?? "Ofertas de ejemplo eliminadas.");
    void load();
  }

  const sampleCount = rows.filter((row) => row.product?.is_sample).length;
  const source = SOURCES.find((item) => item.value === linkSource) ?? SOURCES[0];
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const campaignLink = linkSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || origin}/${linkLocale}/ofertas/${linkSlug}?${new URLSearchParams({ utm_source: source.value, utm_medium: source.medium, utm_campaign: linkSlug, ...(linkContent ? { utm_content: slugify(linkContent) } : {}) }).toString()}`
    : "";

  async function copyLink() {
    try { await navigator.clipboard.writeText(campaignLink); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  }

  if (editing) return <OfferForm user={user} offerId={editing === "new" ? null : editing} onClose={(saved) => { setEditing(null); if (saved) { setMessage(saved); void load(); } }} />;

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Ofertas</h1>
        <button className="dark-button" onClick={() => setEditing("new")}><Plus size={16} /> Nueva oferta</button>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
        {sampleCount > 0 && <button className="admin-action-link" onClick={() => void removeAllSamples()}><Trash2 size={15} /> Eliminar las {sampleCount} de ejemplo</button>}
      </div>
      {message && <p className="admin-notice">{message}</p>}

      <div className="admin-table">
        {rows.length === 0 && <p className="admin-empty">Todavía no hay ofertas.</p>}
        {rows.map((row) => (
          <article key={row.id} className="admin-row">
            <div className="admin-row-head static">
              <b>{row.product?.title ?? row.title}</b>
              <span>{row.product?.destination?.name ?? "—"}</span>
              <span>{formatMoney(money(row.original_price_minor, row.currency_code), "es")} → <b>{formatMoney(money(row.promotional_price_minor, row.currency_code), "es")}</b></span>
              <span>{row.product?.is_sample ? "Ejemplo · " : ""}{row.kind === "flash" ? "⚡ Flash" : "Normal"}{row.featured ? " · Destacada" : ""}{row.product?.verified_at ? " · ✓ Verificada" : ""}</span>
              <span className={`status-pill ${row.is_published ? "status-confirmed" : "status-expired"}`}>{row.is_published ? "Publicada" : "Oculta"}</span>
              <span className="admin-row-buttons">
                <button onClick={() => setEditing(row.id)} aria-label="Editar"><Pencil size={15} /> Editar</button>
                <button onClick={() => void togglePublished(row)}>{row.is_published ? <><EyeOff size={15} /> Ocultar</> : <><Eye size={15} /> Publicar</>}</button>
                {row.product && <a href={`/es/ofertas/${row.product.slug}`} target="_blank" rel="noreferrer"><Link2 size={15} /> Ver</a>}
                {row.product?.is_sample && <button onClick={() => void removeSample(row)}><Trash2 size={15} /> Eliminar</button>}
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="admin-panel-card link-builder">
        <p className="eyebrow warm">ENLACES PARA REDES</p>
        <h2>Generador de enlaces con seguimiento</h2>
        <p className="muted">Usa un enlace distinto por video o publicación. Así, en «Resumen» y en Google Analytics verás qué contenido trae visitas y reservas.</p>
        <div className="admin-form-grid four">
          <label>Oferta<select value={linkSlug} onChange={(event) => setLinkSlug(event.target.value)}>{rows.filter((row) => row.product).map((row) => <option key={row.id} value={row.product!.slug}>{row.product!.title}</option>)}</select></label>
          <label>Red<select value={linkSource} onChange={(event) => setLinkSource(event.target.value)}>{SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>Nombre del video / post<input value={linkContent} onChange={(event) => setLinkContent(event.target.value)} placeholder="ej. video piscina 1" /></label>
          <label>Idioma<select value={linkLocale} onChange={(event) => setLinkLocale(event.target.value)}><option value="es">Español</option><option value="en">English</option><option value="fr">Français</option></select></label>
        </div>
        {campaignLink && <div className="link-output"><code>{campaignLink}</code><button className="dark-button" onClick={() => void copyLink()}><Copy size={15} /> {copied ? "¡Copiado!" : "Copiar"}</button></div>}
      </section>
    </section>
  );
}
