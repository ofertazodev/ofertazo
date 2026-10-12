"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Mail, MessageCircle, Pencil, Phone, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { es } from "@/i18n/dictionaries/es";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/listing";
import { supabase } from "@/lib/supabase-browser";

export const PARTNER_TYPES = { hotel: "Hotel / alojamiento", owner: "Dueño de alojamiento", agency: "Agencia de turismo", tour_operator: "Operador de tours", other: "Otro" } as const;
type PartnerType = keyof typeof PARTNER_TYPES;
const STATUS_LABELS: Record<string, string> = { approved: "Activo", pending_review: "En conversación", suspended: "Pausado", draft: "Borrador", rejected: "Descartado" };
const EDITABLE_STATUSES = ["approved", "pending_review", "suspended"] as const;

type PartnerProduct = { id: string; slug: string; title: string; type: string; property_type: string | null; is_published: boolean };
type Partner = {
  id: string;
  trade_name: string;
  legal_name: string;
  partner_type: PartnerType;
  contact_name: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  status: string;
  products: PartnerProduct[];
};

type Draft = Omit<Partner, "id" | "products">;
const emptyDraft: Draft = { trade_name: "", legal_name: "", partner_type: "hotel", contact_name: "", email: "", phone: "", website: "", city: "", address: "", tax_id: "", notes: "", status: "approved" };

const digits = (value: string | null) => (value ?? "").replace(/\D/g, "");
const orNull = (value: string | null) => (value ?? "").trim() || null;
const productCategory = (product: PartnerProduct) => product.type === "accommodation"
  ? (PROPERTY_TYPES.includes(product.property_type as PropertyType) ? es.propertyTypes[product.property_type as PropertyType] : "Alojamiento")
  : product.type === "package" ? "Escapada" : "Experiencia";

/** Admin → Socios: tourism companies, hotels and owners, their contact details and their offers. */
export function PartnersPanel({ user, onNewOffer }: { user: User; onNewOffer: (providerId: string) => void }) {
  const [rows, setRows] = useState<Partner[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data, error }, destinations] = await Promise.all([
      supabase.from("providers").select("id,trade_name,legal_name,partner_type,contact_name,email,phone,website,city,address,tax_id,notes,status,products(id,slug,title,type,property_type,is_published)").order("trade_name"),
      supabase.from("destinations").select("name").eq("kind", "city").not("slug", "like", "%-destination").order("sort_order")
    ]);
    if (error) { setMessage(error.message); return; }
    setRows((data ?? []) as Partner[]);
    setCities(((destinations.data ?? []) as { name: string }[]).map((item) => item.name));
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(row: Partner | null) {
    setMessage("");
    if (!row) { setDraft(emptyDraft); setEditing("new"); return; }
    setDraft({
      trade_name: row.trade_name, legal_name: row.legal_name, partner_type: row.partner_type, contact_name: row.contact_name ?? "", email: row.email,
      phone: row.phone ?? "", website: row.website ?? "", city: row.city ?? "", address: row.address ?? "", tax_id: row.tax_id ?? "", notes: row.notes ?? "", status: row.status
    });
    setEditing(row.id);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !editing) return;
    const name = draft.trade_name.trim();
    if (name.length < 2) { setMessage("Escribe el nombre del socio."); return; }
    if (!draft.email.trim() && !digits(draft.phone)) { setMessage("Añade al menos un email o un teléfono de contacto."); return; }
    const values = {
      trade_name: name,
      legal_name: draft.legal_name.trim() || name,
      partner_type: draft.partner_type,
      contact_name: orNull(draft.contact_name),
      // email is required by the database; fall back to the admin's email when only a phone is known.
      email: draft.email.trim() || user.email || "",
      phone: orNull(draft.phone),
      website: orNull(draft.website),
      city: orNull(draft.city),
      address: orNull(draft.address),
      tax_id: orNull(draft.tax_id),
      notes: orNull(draft.notes),
      status: draft.status,
      updated_at: new Date().toISOString()
    };
    setSaving(true);
    const result = editing === "new"
      ? await supabase.from("providers").insert({ ...values, owner_id: user.id, country_code: "BO" })
      : await supabase.from("providers").update(values).eq("id", editing);
    setSaving(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(editing === "new" ? `«${name}» registrado como socio.` : `«${name}» guardado.`);
    setEditing(null);
    void load();
  }

  async function remove(row: Partner) {
    if (!supabase) return;
    if (row.products.length) { setMessage(`«${row.trade_name}» tiene ofertas. Pásalo a «Pausado» en lugar de eliminarlo.`); return; }
    if (!window.confirm(`¿Eliminar a «${row.trade_name}»? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("providers").delete().eq("id", row.id);
    setMessage(error?.message ?? `«${row.trade_name}» eliminado.`);
    void load();
  }

  const needle = query.trim().toLowerCase();
  const visible = rows
    .filter((row) => typeFilter === "all" || row.partner_type === typeFilter)
    .filter((row) => !needle || [row.trade_name, row.legal_name, row.contact_name, row.city, row.email, row.phone].some((value) => value?.toLowerCase().includes(needle)));
  const typeCounts = rows.reduce<Record<string, number>>((acc, row) => { acc[row.partner_type] = (acc[row.partner_type] ?? 0) + 1; return acc; }, {});
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const form = (
    <form className="admin-offer-form partner-form" onSubmit={save}>
      <div className="admin-form-grid">
        <label>Nombre comercial *<input required minLength={2} maxLength={160} value={draft.trade_name} onChange={(event) => setField("trade_name", event.target.value)} placeholder="Ej. Hotel Los Parrales" /></label>
        <label>Tipo de socio<select value={draft.partner_type} onChange={(event) => setField("partner_type", event.target.value as PartnerType)}>{Object.entries(PARTNER_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="admin-form-grid three">
        <label>Persona de contacto<input maxLength={120} value={draft.contact_name ?? ""} onChange={(event) => setField("contact_name", event.target.value)} placeholder="Nombre y apellido" /></label>
        <label>Teléfono / WhatsApp<input type="tel" maxLength={30} value={draft.phone ?? ""} onChange={(event) => setField("phone", event.target.value)} placeholder="+591 7..." /></label>
        <label>Email<input type="email" maxLength={254} value={draft.email} onChange={(event) => setField("email", event.target.value)} /></label>
      </div>
      <div className="admin-form-grid three">
        <label>Ciudad<input list="partner-cities" maxLength={80} value={draft.city ?? ""} onChange={(event) => setField("city", event.target.value)} /><datalist id="partner-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist></label>
        <label>Dirección<input maxLength={300} value={draft.address ?? ""} onChange={(event) => setField("address", event.target.value)} /></label>
        <label>Web, Instagram o Facebook<input maxLength={300} value={draft.website ?? ""} onChange={(event) => setField("website", event.target.value)} /></label>
      </div>
      <div className="admin-form-grid three">
        <label>Razón social<input maxLength={160} value={draft.legal_name} onChange={(event) => setField("legal_name", event.target.value)} placeholder="Si es distinta del nombre comercial" /></label>
        <label>NIT<input maxLength={30} value={draft.tax_id ?? ""} onChange={(event) => setField("tax_id", event.target.value)} /></label>
        <label>Estado<select value={draft.status} onChange={(event) => setField("status", event.target.value)}>{EDITABLE_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label>
      </div>
      <label>Notas internas (comisión acordada, cómo contactarlo, condiciones…)<textarea maxLength={4000} value={draft.notes ?? ""} onChange={(event) => setField("notes", event.target.value)} /></label>
      <div className="admin-row-buttons">
        <button className="dark-button" disabled={saving}><Save size={15} /> {saving ? "Guardando..." : "Guardar socio"}</button>
        <button type="button" onClick={() => setEditing(null)}><X size={15} /> Cancelar</button>
      </div>
    </form>
  );

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Socios</h1>
        <button className="dark-button" onClick={() => startEdit(null)}><Plus size={16} /> Registrar socio</button>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Empresas de turismo, hoteles y dueños de alojamientos con los que trabaja Tripya. Sus datos de contacto son internos: nunca se muestran en la web.</p>
      {message && <p className="admin-notice">{message}</p>}
      {editing === "new" && <div className="admin-panel-card">{form}</div>}

      <div className="admin-filters">
        <label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, contacto, ciudad, email o teléfono" aria-label="Buscar socios" /></label>
        <div className="admin-chips" role="group" aria-label="Tipo de socio">
          <button className={`chip ${typeFilter === "all" ? "active" : ""}`} onClick={() => setTypeFilter("all")}>Todos <small>{rows.length}</small></button>
          {Object.entries(PARTNER_TYPES).filter(([value]) => typeCounts[value]).map(([value, label]) => (
            <button key={value} className={`chip ${typeFilter === value ? "active" : ""}`} onClick={() => setTypeFilter(value as PartnerType)}>{label} <small>{typeCounts[value]}</small></button>
          ))}
        </div>
      </div>

      <div className="admin-table">
        {visible.length === 0 && <p className="admin-empty">{rows.length ? "Ningún socio coincide con la búsqueda." : "Todavía no hay socios registrados."}</p>}
        {visible.map((row) => {
          const wa = digits(row.phone);
          const isOpen = expanded === row.id;
          return (
            <article key={row.id} className="admin-row partner-row">
              {editing === row.id ? form : (
                <>
                  <div className="partner-head">
                    <div className="partner-main">
                      <b>{row.trade_name}</b>
                      <span className="admin-sub">{PARTNER_TYPES[row.partner_type] ?? row.partner_type}{row.city ? ` · ${row.city}` : ""}{row.contact_name ? ` · ${row.contact_name}` : ""}</span>
                    </div>
                    <div className="partner-contact">
                      {row.phone && <a href={`tel:${row.phone}`}><Phone size={14} /> {row.phone}</a>}
                      {wa.length >= 7 && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>}
                      {row.email && !row.email.endsWith(".invalid") && <a href={`mailto:${row.email}`}><Mail size={14} /> {row.email}</a>}
                      {row.website && <a href={/^https?:\/\//.test(row.website) ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Web / redes</a>}
                    </div>
                    <span className={`status-pill ${row.status === "approved" ? "status-confirmed" : "status-expired"}`}>{STATUS_LABELS[row.status] ?? row.status}</span>
                    <span className="admin-row-buttons">
                      <button onClick={() => setExpanded(isOpen ? null : row.id)} aria-expanded={isOpen}>{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {row.products.length === 1 ? "1 oferta" : `${row.products.length} ofertas`}</button>
                      <button onClick={() => onNewOffer(row.id)}><Plus size={15} /> Nueva oferta</button>
                      <button onClick={() => startEdit(row)}><Pencil size={15} /> Editar</button>
                      <button onClick={() => void remove(row)} aria-label={`Eliminar ${row.trade_name}`}><Trash2 size={15} /></button>
                    </span>
                  </div>
                  {isOpen && (
                    <div className="partner-detail">
                      {row.notes && <p className="partner-notes"><b>Notas:</b> {row.notes}</p>}
                      {(row.tax_id || row.address || row.legal_name !== row.trade_name) && (
                        <p className="admin-sub">{[row.legal_name !== row.trade_name ? `Razón social: ${row.legal_name}` : "", row.tax_id ? `NIT: ${row.tax_id}` : "", row.address ? `Dirección: ${row.address}` : ""].filter(Boolean).join(" · ")}</p>
                      )}
                      {row.products.length === 0 ? <p className="muted">Este socio todavía no tiene ofertas.</p> : (
                        <ul className="partner-offers">
                          {row.products.map((product) => (
                            <li key={product.id}>
                              <span>{product.title}</span>
                              <small>{productCategory(product)}</small>
                              <span className={`status-pill ${product.is_published ? "status-confirmed" : "status-expired"}`}>{product.is_published ? "Publicada" : "Oculta"}</span>
                              <a href={`/es/ofertas/${product.slug}`} target="_blank" rel="noreferrer">Ver</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
