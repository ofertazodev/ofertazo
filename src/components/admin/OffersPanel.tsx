"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Link2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { localeNames, locales } from "@/i18n/config";
import { es } from "@/i18n/dictionaries/es";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/listing";
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
  product: { id: string; slug: string; title: string; type: string; property_type: string | null; is_published: boolean; verified_at: string | null; is_sample?: boolean; destination: { name: string } | null; provider: { id: string; trade_name: string } | null } | null;
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

/** Category of an offer as the admin thinks of it: the 8 accommodation groups, getaways and experiences. */
function categoryOf(row: OfferRow): string {
  const product = row.product;
  if (!product) return "other";
  if (product.type === "accommodation") return PROPERTY_TYPES.includes(product.property_type as PropertyType) ? `pt:${product.property_type}` : "pt:none";
  return product.type;
}

const CATEGORY_ORDER = [...PROPERTY_TYPES.map((type) => `pt:${type}`), "pt:none", "package", "tour", "other"];
const categoryLabel = (key: string) => key.startsWith("pt:")
  ? (key === "pt:none" ? "Alojamiento sin tipo" : es.propertyTypeGroups[key.slice(3) as PropertyType])
  : key === "package" ? "Escapadas" : key === "tour" ? "Experiencias" : "Otros";

export function OffersPanel({ user, presetProviderId = null, onPresetUsed }: { user: User; presetProviderId?: string | null; onPresetUsed?: () => void }) {
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(presetProviderId ? "new" : null);
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
      .select("id,title,kind,is_published,featured,original_price_minor,promotional_price_minor,currency_code,ends_at,product:products(*,destination:destinations(name),provider:providers(id,trade_name))")
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
    if (!window.confirm(`¿Eliminar la oferta de ejemplo «${row.product.title}»? También se borran sus reservas de prueba.`)) return;
    const { error } = await supabase.rpc("delete_sample_products", { p_ids: [row.product.id] });
    setMessage(error?.message ?? "Oferta de ejemplo eliminada.");
    void load();
  }

  async function removeAllSamples() {
    if (!supabase) return;
    const ids = rows.filter((row) => row.product?.is_sample).map((row) => row.product!.id);
    if (!ids.length || !window.confirm(`¿Eliminar las ${ids.length} ofertas de ejemplo? Se borran también sus reservas de prueba. Las ofertas reales no se tocan.`)) return;
    const { error } = await supabase.rpc("delete_sample_products", { p_ids: ids });
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

  if (editing) return <OfferForm user={user} offerId={editing === "new" ? null : editing} presetProviderId={editing === "new" ? presetProviderId : null} onClose={(saved) => { setEditing(null); onPresetUsed?.(); if (saved) { setMessage(saved); void load(); } }} />;

  const counts = rows.reduce<Record<string, number>>((acc, row) => { const key = categoryOf(row); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
  const accommodationCount = Object.entries(counts).filter(([key]) => key.startsWith("pt:")).reduce((sum, [, n]) => sum + n, 0);
  const needle = query.trim().toLowerCase();
  const visible = rows
    .filter((row) => category === "all" || (category === "accommodation" ? categoryOf(row).startsWith("pt:") : categoryOf(row) === category))
    .filter((row) => !needle || [row.product?.title ?? row.title, row.product?.destination?.name, row.product?.provider?.trade_name].some((value) => value?.toLowerCase().includes(needle)))
    .sort((a, b) => CATEGORY_ORDER.indexOf(categoryOf(a)) - CATEGORY_ORDER.indexOf(categoryOf(b)));
  const chips: { key: string; label: string; n: number }[] = [
    { key: "all", label: "Todas", n: rows.length },
    { key: "accommodation", label: "Alojamientos", n: accommodationCount },
    ...PROPERTY_TYPES.map((type) => ({ key: `pt:${type}`, label: es.propertyTypeGroups[type], n: counts[`pt:${type}`] ?? 0 })),
    { key: "package", label: "Escapadas", n: counts.package ?? 0 },
    { key: "tour", label: "Experiencias", n: counts.tour ?? 0 }
  ];

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Ofertas</h1>
        <button className="dark-button" onClick={() => setEditing("new")}><Plus size={16} /> Nueva oferta</button>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
        {sampleCount > 0 && <button className="admin-action-link" onClick={() => void removeAllSamples()}><Trash2 size={15} /> Eliminar las {sampleCount} de ejemplo</button>}
      </div>
      {message && <p className="admin-notice">{message}</p>}

      <div className="admin-filters">
        <label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, ciudad o socio" aria-label="Buscar ofertas" /></label>
        <div className="admin-chips" role="group" aria-label="Categorías">
          {chips.filter((chip) => chip.n > 0 || chip.key === "all" || chip.key === category).map((chip) => (
            <button key={chip.key} className={`chip ${category === chip.key ? "active" : ""}`} onClick={() => setCategory(chip.key)}>{chip.label} <small>{chip.n}</small></button>
          ))}
        </div>
      </div>

      <div className="admin-table">
        {visible.length === 0 && <p className="admin-empty">{rows.length ? "Ninguna oferta coincide con el filtro." : "Todavía no hay ofertas."}</p>}
        {visible.map((row, index) => (
          <Fragment key={row.id}>
          {(index === 0 || categoryOf(visible[index - 1]) !== categoryOf(row)) && <h3 className="admin-group-title">{categoryLabel(categoryOf(row))}</h3>}
          <article className="admin-row">
            <div className="admin-row-head static">
              <b>{row.product?.title ?? row.title}</b>
              <span>{row.product?.destination?.name ?? "—"}<small className="admin-sub">{row.product?.provider?.trade_name ?? "Sin socio"}</small></span>
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
          </Fragment>
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
          <label>Idioma<select value={linkLocale} onChange={(event) => setLinkLocale(event.target.value)}>{locales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
        </div>
        {campaignLink && <div className="link-output"><code>{campaignLink}</code><button className="dark-button" onClick={() => void copyLink()}><Copy size={15} /> {copied ? "¡Copiado!" : "Copiar"}</button></div>}
      </section>
    </section>
  );
}
