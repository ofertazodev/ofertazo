"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, MessageCircle, RefreshCw, X } from "lucide-react";
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
  handed_off_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_amount_minor: number | null;
  payment_confirmed_at: string | null;
  booking_items: { title_snapshot: string; extras: { name: string }[]; product: { slug: string; provider: { trade_name: string; contact_name: string | null; phone: string | null } | null } | null }[];
};

const PAYMENT_METHODS = { qr: "QR", transfer: "Transferencia", cash: "Efectivo", card: "Tarjeta", other: "Otro" } as const;
/** Bookings the sales team still has to collect: new requests and those waiting for the QR payment. */
const OPEN_STATUSES: BookingStatus[] = ["pending", "awaiting_payment"];
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const SELECT = "id,code,status,created_at,contact_name,contact_email,contact_phone,check_in,check_out,guests,total_minor,currency_code,notes,locale,attribution,admin_notes,handed_off_at,payment_method,payment_reference,payment_amount_minor,payment_confirmed_at,booking_items(title_snapshot,extras,product:products(slug,provider:providers(trade_name,contact_name,phone)))";

function customerWhatsapp(row: BookingRow) {
  const digits = (row.contact_phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  const greeting = row.locale === "en" ? "Hi" : row.locale === "fr" ? "Bonjour" : "Hola";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`${greeting} ${row.contact_name.split(" ")[0]}, te escribimos de Tripya por tu reserva ${row.code ?? ""}.`)}`;
}

export function BookingsPanel() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "" | "open">("open");
  const [paying, setPaying] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let query = supabase.from("bookings").select(SELECT).order("created_at", { ascending: false }).limit(200);
    if (filter === "open") query = query.in("status", OPEN_STATUSES);
    else if (filter) query = query.eq("status", filter);
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

  async function confirmPayment(event: FormEvent<HTMLFormElement>, row: BookingRow) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const amount = Number(String(form.get("amount") ?? "").replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) { setMessage("Escribe el monto recibido en bolivianos (ej. 450 o 450.50)."); return; }
    const { error } = await supabase.rpc("confirm_booking_payment", {
      p_booking_id: row.id,
      p_amount_minor: Math.round(amount * 100),
      p_reference: String(form.get("reference") ?? ""),
      p_method: String(form.get("method") ?? "qr")
    });
    if (error) { setMessage(error.message.includes("invalid_status_transition") ? "Esta reserva ya no está pendiente de pago." : error.message); return; }
    setPaying(null);
    setMessage(`Pago de la reserva ${row.code} confirmado.`);
    void load();
  }

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Reservas</h1>
        <select value={filter} onChange={(event) => setFilter(event.target.value as BookingStatus | "" | "open")}>
          <option value="open">Por cobrar (nuevas + esperando pago)</option>
          <option value="">Todos los estados</option>
          {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{BOOKING_STATUS_LABELS[status]}</option>)}
        </select>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Flujo del piloto: el cliente envía la reserva y llega al WhatsApp del agente con todos los datos → <b>Esperando pago</b> (el agente confirma disponibilidad con el socio y envía su QR) → <b>Confirmar pago</b> cuando llegue el dinero → <b>Pagada</b> → <b>Confirmada</b> → <b>Completada</b>.</p>
      {message && <p className="admin-notice">{message}</p>}
      {loading ? <LlamaLoader size="sm" label="Cargando..." /> : rows.length === 0 ? <p className="admin-empty">No hay reservas con este estado.</p> : (
        <div className="admin-table">
          {rows.map((row) => {
            const item = row.booking_items[0];
            const partner = item?.product?.provider ?? null;
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
                      <dt>Socio / alojamiento</dt><dd>{partner ? <>{partner.trade_name}{partner.contact_name ? ` · ${partner.contact_name}` : ""}{partner.phone ? <> · <a href={waLink(partner.phone)} target="_blank" rel="noreferrer">{partner.phone}</a></> : null}</> : "—"}</dd>
                      <dt>Enviado a WhatsApp</dt><dd>{row.handed_off_at ? formatDateTime(row.handed_off_at, "es") : "No (cerró antes de la redirección)"}</dd>
                      {row.payment_confirmed_at && <><dt>Pago</dt><dd><b>{formatMoney(money(row.payment_amount_minor ?? 0, row.currency_code), "es")}</b> · {PAYMENT_METHODS[(row.payment_method ?? "other") as keyof typeof PAYMENT_METHODS] ?? row.payment_method}{row.payment_reference ? ` · Ref. ${row.payment_reference}` : ""} · {formatDateTime(row.payment_confirmed_at, "es")}</dd></>}
                      <dt>Personas</dt><dd>{row.guests ?? "—"}</dd>
                      <dt>Email</dt><dd><a href={`mailto:${row.contact_email}?subject=${encodeURIComponent(`Tu reserva ${row.code ?? ""}`)}`}>{row.contact_email}</a></dd>
                      <dt>Teléfono</dt><dd>{row.contact_phone ?? "—"}</dd>
                      {item?.extras?.length > 0 && <><dt>Extras</dt><dd>{item.extras.map((extra) => extra.name).join(", ")}</dd></>}
                      {row.notes && <><dt>Comentarios</dt><dd>{row.notes}</dd></>}
                      <dt>Idioma</dt><dd>{row.locale.toUpperCase()}</dd>
                      <dt>Origen</dt><dd>{Object.entries(row.attribution ?? {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || "directo"}</dd>
                    </dl>
                    {OPEN_STATUSES.includes(row.status) && (paying === row.id ? (
                      <form className="payment-form" onSubmit={(event) => void confirmPayment(event, row)}>
                        <label>Monto recibido (Bs)<input name="amount" inputMode="decimal" required defaultValue={(row.total_minor / 100).toString()} /></label>
                        <label>Método<select name="method" defaultValue="qr">{Object.entries(PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label>N.º de operación / referencia<input name="reference" maxLength={120} placeholder="Opcional" /></label>
                        <div className="admin-row-buttons">
                          <button className="dark-button"><CheckCircle2 size={16} /> Confirmar pago</button>
                          <button type="button" onClick={() => setPaying(null)}><X size={15} /> Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <button className="dark-button payment-cta" onClick={() => setPaying(row.id)}><CheckCircle2 size={16} /> Confirmar pago</button>
                    ))}
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
