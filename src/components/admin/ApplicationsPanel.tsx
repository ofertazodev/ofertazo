"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase-browser";

const STATUSES = { new: "Nueva", contacted: "Contactada", approved: "Aprobada", rejected: "Rechazada" } as const;
type ApplicationStatus = keyof typeof STATUSES;

type Application = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  business_name: string;
  property_type: string;
  city: string;
  address: string | null;
  contact_name: string;
  email: string;
  phone: string;
  website: string | null;
  capacity: string | null;
  services: string | null;
  regular_price: string | null;
  offered_price: string | null;
  high_season: string | null;
  low_season: string | null;
  availability: string | null;
  conditions: string | null;
  message: string | null;
  photo_paths: string[];
  admin_notes: string | null;
};

const FIELDS: [keyof Application, string][] = [
  ["property_type", "Tipo"], ["city", "Ciudad"], ["address", "Dirección"], ["capacity", "Capacidad"], ["contact_name", "Contacto"],
  ["email", "Email"], ["phone", "WhatsApp"], ["website", "Web / redes"], ["services", "Servicios"], ["regular_price", "Precio habitual"],
  ["offered_price", "Precio para Tripya"], ["high_season", "Temporada alta"], ["low_season", "Temporada baja"],
  ["availability", "Disponibilidad"], ["conditions", "Condiciones"], ["message", "Mensaje"]
];

export function ApplicationsPanel() {
  const [rows, setRows] = useState<Application[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | "">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    let query = supabase.from("provider_applications").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter) query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) { setMessage(error.message); return; }
    setRows((data ?? []) as Application[]);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function open(row: Application) {
    setOpenId(openId === row.id ? null : row.id);
    if (!supabase || photos[row.id] || row.photo_paths.length === 0) return;
    const { data } = await supabase.storage.from("provider-applications").createSignedUrls(row.photo_paths, 3600);
    setPhotos((current) => ({ ...current, [row.id]: (data ?? []).map((item) => item.signedUrl).filter((url): url is string => Boolean(url)) }));
  }

  async function update(row: Application, changes: Partial<Pick<Application, "status" | "admin_notes">>) {
    if (!supabase) return;
    const { error } = await supabase.from("provider_applications").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", row.id);
    setMessage(error ? error.message : `${row.business_name} actualizado.`);
    void load();
  }

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Solicitudes de proveedores</h1>
        <select value={filter} onChange={(event) => setFilter(event.target.value as ApplicationStatus | "")}>
          <option value="">Todas</option>
          {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Llegan desde «Publica tu alojamiento». Tras verificar el alojamiento, créalo en la pestaña Ofertas y marca «Verificado».</p>
      {message && <p className="admin-notice">{message}</p>}
      {rows.length === 0 ? <p className="admin-empty">No hay solicitudes con este estado.</p> : (
        <div className="admin-table">
          {rows.map((row) => {
            const digits = row.phone.replace(/\D/g, "");
            return (
              <article key={row.id} className={`admin-row ${openId === row.id ? "open" : ""}`}>
                <button className="admin-row-head" onClick={() => void open(row)}>
                  <b>{row.business_name}</b><span>{row.city}</span><span>{row.contact_name}</span><span>{formatDateTime(row.created_at, "es")}</span>
                  <span className={`status-pill app-${row.status}`}>{STATUSES[row.status]}</span>
                </button>
                {openId === row.id && (
                  <div className="admin-row-body">
                    <dl className="review-list">{FIELDS.filter(([key]) => row[key]).map(([key, label]) => <Fragment key={key}><dt>{label}</dt><dd>{String(row[key])}</dd></Fragment>)}</dl>
                    {(photos[row.id] ?? []).length > 0 && <div className="admin-photos">{photos[row.id].map((url) => <a key={url} href={url} target="_blank" rel="noreferrer"><Image src={url} alt={row.business_name} width={160} height={120} unoptimized /></a>)}</div>}
                    <div className="admin-row-actions">
                      {digits.length >= 7 && <a className="admin-action-link" href={`https://wa.me/${digits}?text=${encodeURIComponent(`Hola ${row.contact_name.split(" ")[0]}, te escribimos de Tripya por tu solicitud para publicar ${row.business_name}.`)}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a>}
                      <label>Estado
                        <select value={row.status} onChange={(event) => void update(row, { status: event.target.value as ApplicationStatus })}>
                          {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                    </div>
                    <form className="admin-notes" onSubmit={(event) => { event.preventDefault(); void update(row, { admin_notes: String(new FormData(event.currentTarget).get("notes") ?? "") || null }); }}>
                      <label>Notas internas<textarea name="notes" defaultValue={row.admin_notes ?? ""} /></label>
                      <button className="dark-button">Guardar notas</button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
