"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, MessageCircle, RefreshCw } from "lucide-react";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES, BOOKING_TRANSITIONS, type BookingStatus } from "@/lib/booking-status";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatMoney, money } from "@/lib/money";
import { supabase } from "@/lib/supabase-browser";
import { LlamaLoader } from "@/components/site/TripyaLogo";

type BookingRow = {
  id: string;
  code: string | null;
  status: BookingStatus;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  total_minor: number;
  currency_code: string;
  notes: string | null;
  locale: string;
  attribution: Record<string, string>;
  admin_notes: string | null;
  booking_items: { title_snapshot: string; extras: { name: string }[]; product: { slug: string } | null }[];
};

const SELECT = "id,code,status,created_at,contact_name,contact_email,contact_phone,check_in,check_out,guests,total_minor,currency_code,notes,locale,attribution,admin_notes,booking_items(title_snapshot,extras,product:products(slug))";

function customerWhatsapp(row: BookingRow) {
  const digits = (row.contact_phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  const greeting = row.locale === "en" ? "Hi" : row.locale === "fr" ? "Bonjour" : "Hola";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`${greeting} ${row.contact_name.split(" ")[0]}, te escribimos de Tripya por tu reserva ${row.code ?? ""}.`)}`;
}

export function BookingsPanel() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "">("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let query = supabase.from("bookings").select(SELECT).order("created_at", { ascending: false }).limit(200);
    if (filter) query = query.eq("status", filter);
    const { data, error } = await query;
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setRows((data ?? []) as unknown as BookingRow[]);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function update(row: BookingRow, changes: Partial<Pick<BookingRow, "status" | "admin_notes">>) {
    if (!supabase) return;
    const { error } = await supabase.from("bookings").update(changes).eq("id", row.id);
    if (error) { setMessage(error.message.includes("invalid_status_transition") ? "Ese cambio de estado no está permitido." : error.message); return; }
    setMessage(`Reserva ${row.code} actualizada.`);
    void load();
  }

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Reservas</h1>
        <select value={filter} onChange={(event) => setFilter(event.target.value as BookingStatus | "")}>
          <option value="">Todos los estados</option>
          {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{BOOKING_STATUS_LABELS[status]}</option>)}
        </select>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Flujo del piloto: <b>Solicitud recibida</b> → confirmas disponibilidad con el alojamiento → <b>Esperando pago</b> (envías instrucciones) → <b>Pagada</b> → <b>Confirmada</b> → <b>Completada</b>.</p>
      {message && <p className="admin-notice">{message}</p>}
      {loading ? <LlamaLoader size="sm" label="Cargando..." /> : rows.length === 0 ? <p className="admin-empty">No hay reservas con este estado.</p> : (
        <div className="admin-table">
          {rows.map((row) => {
            const item = row.booking_items[0];
            const wa = customerWhatsapp(row);
            const open = openId === row.id;
            return (
              <article key={row.id} className={`admin-row ${open ? "open" : ""}`}>
                <button className="admin-row-head" onClick={() => setOpenId(open ? null : row.id)}>
                  <b className="mono">{row.code ?? "—"}</b>
                  <span>{item?.title_snapshot ?? "—"}</span>
                  <span>{row.contact_name}</span>
                  <span>{row.check_in ? `${formatDate(row.check_in, "es", { day: "numeric", month: "short" })} → ${row.check_out ? formatDate(row.check_out, "es", { day: "numeric", month: "short" }) : ""}` : "—"}</span>
                  <span>{formatMoney(money(row.total_minor, row.currency_code), "es")}</span>
                  <span className={`status-pill status-${row.status}`}>{BOOKING_STATUS_LABELS[row.status]}</span>
                </button>
                {open && (
                  <div className="admin-row-body">
                    <dl className="review-list">
                      <dt>Recibida</dt><dd>{formatDateTime(row.created_at, "es")}</dd>
                      <dt>Personas</dt><dd>{row.guests ?? "—"}</dd>
                      <dt>Email</dt><dd><a href={`mailto:${row.contact_email}?subject=${encodeURIComponent(`Tu reserva ${row.code ?? ""}`)}`}>{row.contact_email}</a></dd>
                      <dt>Teléfono</dt><dd>{row.contact_phone ?? "—"}</dd>
                      {item?.extras?.length > 0 && <><dt>Extras</dt><dd>{item.extras.map((extra) => extra.name).join(", ")}</dd></>}
                      {row.notes && <><dt>Comentarios</dt><dd>{row.notes}</dd></>}
                      <dt>Idioma</dt><dd>{row.locale.toUpperCase()}</dd>
                      <dt>Origen</dt><dd>{Object.entries(row.attribution ?? {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || "directo"}</dd>
                    </dl>
                    <div className="admin-row-actions">
                      {wa && <a className="admin-action-link" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp al cliente</a>}
                      {item?.product && <a className="admin-action-link" href={`/es/ofertas/${item.product.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Ver oferta</a>}
                      <label>Cambiar estado
                        <select value="" onChange={(event) => event.target.value && void update(row, { status: event.target.value as BookingStatus })} disabled={BOOKING_TRANSITIONS[row.status].length === 0}>
                          <option value="">—</option>
                          {BOOKING_TRANSITIONS[row.status].map((status) => <option key={status} value={status}>{BOOKING_STATUS_LABELS[status]}</option>)}
                        </select>
                      </label>
                    </div>
                    <form className="admin-notes" onSubmit={(event) => { event.preventDefault(); void update(row, { admin_notes: String(new FormData(event.currentTarget).get("notes") ?? "") || null }); }}>
                      <label>Notas internas (no las ve el cliente)<textarea name="notes" defaultValue={row.admin_notes ?? ""} /></label>
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
